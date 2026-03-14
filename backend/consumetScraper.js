const { ANIME } = require('@consumet/extensions');
const gogoanime = new ANIME.Gogoanime();

/**
 * Advanced Fix 2: Use Consumet to fetch episodes and diverse servers
 * @param {string} title 
 * @returns {Array} List of episodes
 */
async function fetchConsumetEpisodes(title) {
    try {
        console.log(`[Consumet] Searching for: ${title}`);
        const results = await gogoanime.search(title);
        
        if (results.results.length === 0) {
            console.log(`[Consumet] No results found for: ${title}`);
            return [];
        }

        // Find the best match
        const bestMatch = results.results[0];
        console.log(`[Consumet] Found best match: ${bestMatch.title} (ID: ${bestMatch.id})`);

        const info = await gogoanime.fetchAnimeInfo(bestMatch.id);
        
        return info.episodes.map(ep => ({
            episode_number: ep.number,
            title: `Episode ${ep.number}`,
            id: ep.id,
            link: ep.url
        }));
    } catch (err) {
        console.error(`[Consumet] Episode fetch error:`, err.message);
        return [];
    }
}

/**
 * Advanced Fix 3: Fetch diverse servers like StreamSB, Filemoon, Doodstream
 * @param {string} episodeId 
 * @returns {Object} Categorized servers
 */
async function fetchConsumetServers(episodeId) {
    try {
        const sources = await gogoanime.fetchEpisodeSources(episodeId);
        
        const servers = { sub: [], dub: [], extra: [] };

        // Consumet sources usually include headers and multiple servers
        if (sources.sources) {
            sources.sources.forEach(s => {
                servers.sub.push({
                    id: `consumet-sub-${s.quality}`,
                    name: s.quality === 'default' ? 'Consumet' : `Consumet ${s.quality}`,
                    link: s.url,
                    type: 'hls',
                    custom: true
                });
            });
        }

        // Add additional mirrors from Consumet's other servers if available
        // Note: Consumet returns separate embed links in some cases or just HLS streams
        // We'll map them to our UI
        return servers;
    } catch (err) {
        console.error(`[Consumet] Server fetch error:`, err.message);
        return { sub: [], dub: [], extra: [] };
    }
}

module.exports = { fetchConsumetEpisodes, fetchConsumetServers };
