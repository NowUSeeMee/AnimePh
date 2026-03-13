require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const compression = require('compression');
const { scrapeEpisodesForTitle, fetchServers, fetchSources } = require('./scraper');

const app = express();
const port = process.env.PORT || 5000;

app.use(compression());
app.use(cors());
app.use(express.json());

// Health check routes
app.get('/', (req, res) => {
    res.send('<h1>AnimePh Backend is Running</h1><p>API is available at <a href="/api">/api</a></p>');
});

app.get('/api', (req, res) => {
    res.json({ 
        status: 'online', 
        message: 'AnimePh API is active',
        endpoints: [
            '/api/favorites',
            '/api/episodes/:id',
            '/api/comments/:id',
            '/api/history'
        ]
    });
});

// MySQL Database connection pool
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'animeph',
    port: process.env.DB_PORT || 3306,
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
});

// Middleware to ensure anime is cached in our DB
const ensureAnimeCached = async (req, res, next) => {
    const { anime_id, title, title_english, image_url, synopsis, type, score, status } = req.body;
    const malId = anime_id || req.params.id;

    if (!malId) return next();

    try {
        const [rows] = await db.query('SELECT mal_id FROM anime WHERE mal_id = ?', [malId]);
        if (rows.length === 0 && title) {
            await db.query(
                'INSERT INTO anime (mal_id, title, title_english, image_url, synopsis, type, score, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [malId, title, title_english || null, image_url, synopsis || null, type || null, score || null, status || null]
            );
        }
        next();
    } catch (err) {
        console.error('Cache error:', err);
        res.status(500).json({ error: 'Failed to cache anime' });
    }
};

// --- API ENDPOINTS ---

// GET: All favorites for user 1
app.get('/api/favorites', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT f.*, a.title, a.image_url, a.type 
            FROM favorites f 
            JOIN anime a ON f.anime_id = a.mal_id 
            WHERE f.user_id = 1 
            ORDER BY f.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Add to favorites (demo user 1)
app.post('/api/favorites', ensureAnimeCached, async (req, res) => {
    const { anime_id, status } = req.body;
    try {
        await db.query(
            'INSERT INTO favorites (user_id, anime_id, status) VALUES (1, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status)',
            [anime_id, status || 'plan_to_watch']
        );
        res.status(201).json({ message: 'Success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- EPISODES API (Scraper Integration) ---
app.get('/api/episodes/:id', async (req, res) => {
    const malId = req.params.id;
    const title = req.query.title; // Passed from frontend to help search
    const titleEnglish = req.query.titleEnglish;
    
    try {
        console.log(`[Backend] Episode request received for MAL ID: ${malId}, Title: ${title}, English: ${titleEnglish}`);
        
        // 1. Check if we already have episodes cached in DB using the MAL ID
        const [rows] = await db.query('SELECT * FROM episodes WHERE anime_id = ? ORDER BY episode_number ASC', [malId]);
        
        if (rows.length > 0) {
            console.log(`[Backend] Returning ${rows.length} cached episodes for MAL ID ${malId}`);
            res.json(rows); // Return immediately to avoid blocking

            // Check if we need to update in the background (older than 24 hours)
            if (title && title !== 'undefined') {
                try {
                    const [animeRows] = await db.query('SELECT updated_at FROM anime WHERE mal_id = ?', [malId]);
                    if (animeRows.length > 0) {
                        const updatedAt = new Date(animeRows[0].updated_at);
                        const now = new Date();
                        const diffHours = (now - updatedAt) / (1000 * 60 * 60);

                        if (diffHours >= 24) {
                            console.log(`[Backend] Episodes for ${malId} are ${diffHours.toFixed(1)}h old. Triggering background scrape...`);
                            // Spawn non-blocking background task
                            scrapeEpisodesForTitle(title, titleEnglish).then(async (scrapedEpisodes) => {
                                if (scrapedEpisodes && scrapedEpisodes.length > rows.length) {
                                    console.log(`[Backend] Background scrape found ${scrapedEpisodes.length - rows.length} new episodes for ${malId}`);
                                    const values = scrapedEpisodes.map(ep => [
                                        malId, ep.episode_number, ep.title, ep.link, ep.data_id
                                    ]);
                                    
                                    await db.query('INSERT IGNORE INTO episodes (anime_id, episode_number, title, link, data_id) VALUES ?', [values]);
                                    // Update the timestamp in the anime table
                                    await db.query('UPDATE anime SET updated_at = NOW() WHERE mal_id = ?', [malId]);
                                    console.log(`[Backend] Database updated with new episodes for ${malId}`);
                                } else {
                                    // Update timestamp anyway to avoid re-scraping immediately
                                    await db.query('UPDATE anime SET updated_at = NOW() WHERE mal_id = ?', [malId]);
                                    console.log(`[Backend] Background scrape complete for ${malId}, no new episodes found.`);
                                }
                            }).catch(err => console.error(`[Backend] Background scrape error for ${malId}:`, err.message));
                        }
                    }
                } catch (err) {
                    console.error(`[Backend] Error checking update timestamp for ${malId}:`, err.message);
                }
            }
            return; // We already sent res.json()
        }

        // 2. If not in DB, we need to scrape. We MUST have a title to search provider.
        if (!title || title === 'undefined') {
            console.error(`[Backend] Missing title for MAL ID ${malId}`);
            return res.status(400).json({ error: "Title is required for initial scraping" });
        }

        console.log(`[Backend] No episodes cached for MAL ID ${malId} (${title}). Scraping provider...`);
        const scrapedEpisodes = await scrapeEpisodesForTitle(title, titleEnglish);

        if (!scrapedEpisodes || scrapedEpisodes.length === 0) {
            console.log(`[Backend] Scraper returned 0 episodes for ${title}`);
            return res.status(404).json({ error: "No episodes found from scraper." });
        }

        // 3. Ensure the anime record exists before inserting episodes (foreign key)
        const [existingAnime] = await db.query('SELECT mal_id FROM anime WHERE mal_id = ?', [malId]);
        if (existingAnime.length === 0) {
            await db.query(
                'INSERT IGNORE INTO anime (mal_id, title, title_english) VALUES (?, ?, ?)',
                [malId, title, titleEnglish || null]
            );
            console.log(`[Backend] Auto-cached anime record for MAL ID ${malId}`);
        }

        // 4. Save scraped episodes to database using the MAL ID as the anime_id foreign key
        const values = scrapedEpisodes.map(ep => [
            malId,
            ep.episode_number,
            ep.title,
            ep.link,
            ep.data_id
        ]);

        await db.query(
            'INSERT IGNORE INTO episodes (anime_id, episode_number, title, link, data_id) VALUES ?',
            [values]
        );

        console.log(`[Backend] Saved ${scrapedEpisodes.length} episodes to database for MAL ID ${malId}`);
        res.json(scrapedEpisodes);

    } catch (err) {
        console.error('[Backend] Episode fetch error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET: Servers for an episode
app.get('/api/episodes/servers/:episodeId', async (req, res) => {
    try {
        const { mal_id, ep } = req.query;
        // Scraper Servers First
        const servers = await fetchServers(req.params.episodeId);
        
        // Ensure sub/dub arrays exist
        if (!servers.sub) servers.sub = [];
        if (!servers.dub) servers.dub = [];
        if (!servers.mix) servers.mix = [];

        // Dynamic Standalone Embed Providers
        if (mal_id && ep) {
            // Highly Reliable Mirrored Aggregators (Promoted to Primary for Stability)
            servers.sub.unshift({ id: 'vidsrc-xyz', name: 'VidSrc (High Speed) ⚡', custom: true, type: 'iframe', link: `https://vidsrc.xyz/embed/anime/${mal_id}/${ep}` });
            servers.sub.unshift({ id: 'vidlink-pro', name: 'MegaCloud (Global) 🌏', custom: true, type: 'iframe', link: `https://vidlink.pro/embed/anime/${mal_id}/${ep}` });
            servers.sub.push({ id: 'vidsrc-cc', name: 'T-Cloud (Premium) 🔥', custom: true, type: 'iframe', link: `https://vidsrc.cc/v2/embed/anime/${mal_id}/${ep}/sub` });
            
            servers.dub.unshift({ id: 'vidsrc-cc-dub', name: 'MegaCloud (Dub) 🔥', custom: true, type: 'iframe', link: `https://vidsrc.cc/v2/embed/anime/${mal_id}/${ep}/dub` });
            
            // Mirror Backup section
            if (!servers.extra) servers.extra = [];
            servers.extra.push({ id: 'vidsrc-to', name: 'Mirror 1 💎', custom: true, type: 'iframe', link: `https://vidsrc.to/embed/anime/${mal_id}/${ep}` });
            servers.extra.push({ id: 'vidsrc-me', name: 'Mirror 2 💎', custom: true, type: 'iframe', link: `https://vidsrc.me/embed/anime/${mal_id}/${ep}` });
            servers.extra.push({ id: 'vidsrc-icu', name: 'Mirror 3 🧊', custom: true, type: 'iframe', link: `https://vidsrc.icu/embed/anime/${mal_id}/${ep}` });
            servers.extra.push({ id: 'vidsrc-pm', name: 'Mirror 4 🚀', custom: true, type: 'iframe', link: `https://vidsrc.pm/embed/anime/${mal_id}/${ep}` });
        }
        res.json(servers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET: Source for a server
app.get('/api/episodes/sources/:serverId', async (req, res) => {
    try {
        const sourceData = await fetchSources(req.params.serverId);
        res.json(sourceData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE: Remove from favorites
app.delete('/api/favorites/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM favorites WHERE user_id = 1 AND anime_id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET: Check if favorite
app.get('/api/favorites/check/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM favorites WHERE user_id = 1 AND anime_id = ?', [req.params.id]);
        res.json({ isFavorite: rows.length > 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- COMMENTS API ---

app.get('/api/comments/:id', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, u.username 
            FROM comments c 
            JOIN users u ON c.user_id = u.id 
            WHERE c.anime_id = ? 
            ORDER BY c.created_at DESC
        `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/comments', ensureAnimeCached, async (req, res) => {
    const { anime_id, content } = req.body;
    try {
        await db.query('INSERT INTO comments (user_id, anime_id, content) VALUES (1, ?, ?)', [anime_id, content]);
        res.status(201).json({ message: 'Comment posted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- WATCH HISTORY API ---

app.get('/api/history', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT h.*, a.title, a.image_url 
            FROM watch_history h 
            JOIN anime a ON h.anime_id = a.mal_id 
            WHERE h.user_id = 1 
            ORDER BY h.watched_at DESC 
            LIMIT 50
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/history', ensureAnimeCached, async (req, res) => {
    const { anime_id, episode_number } = req.body;
    try {
        await db.query(
            'INSERT INTO watch_history (user_id, anime_id, episode_number) VALUES (1, ?, ?)',
            [anime_id, episode_number || null]
        );
        res.status(201).json({ message: 'History updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
