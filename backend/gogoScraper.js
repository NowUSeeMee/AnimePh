const axios = require('axios');
const cheerio = require('cheerio');

// GogoAnime/Anitaku is much more stable for scraping
const GOGO_BASE = 'https://anitaku.to'; 
const GOGO_AJAX_BASE = 'https://ajax.gogocdn.net';

const axiosInstance = axios.create({
  baseURL: GOGO_BASE,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
  },
  timeout: 10000
});

async function scrapeGogoEpisodes(title) {
  try {
    console.log(`[Gogo] Searching for: ${title}`);
    // 1. Search for the anime
    const searchRes = await axiosInstance.get(`/search.html?keyword=${encodeURIComponent(title)}`);
    const $ = cheerio.load(searchRes.data);
    
    // 2. Find the best match
    let results = [];
    $('.items li').each((i, el) => {
        const nameEl = $(el).find('.name a');
        results.push({ name: nameEl.text().trim(), link: nameEl.attr('href') });
    });

    if (results.length === 0) return [];

    // Priority 1: Exact Match
    let bestMatch = results.find(r => r.name.toLowerCase() === title.toLowerCase());
    
    // Priority 2: Title starts with searchTitle and is NOT a movie/special
    if (!bestMatch) {
        const filtered = results.filter(r => {
            const lowName = r.name.toLowerCase();
            const lowSearch = title.toLowerCase();
            return lowName.startsWith(lowSearch) && 
                   !lowName.includes('movie') && 
                   !lowName.includes('special') && 
                   !lowName.includes('ova');
        });
        if (filtered.length > 0) {
            bestMatch = filtered.sort((a, b) => a.name.length - b.name.length)[0];
        }
    }

    // Priority 3: Fallback to first
    if (!bestMatch) bestMatch = results[0];

    // 3. Get the internal anime ID from the watch page (needed for episode list AJAX)
    const animePage = await axiosInstance.get(bestMatch.link);
    const $page = cheerio.load(animePage.data);
    
    // Gogo uses an input with id='movie_id' on the anime details page
    const movie_id = $page('#movie_id').val() || $page('.anime_info_episodes_next #movie_id').val();
    const alias = bestMatch.link.replace('/category/', '');
    
    if (!movie_id) {
        console.error(`[Gogo] Could not find movie_id for ${bestMatch.name}`);
        return [];
    }

    console.log(`[Gogo] Found: ${bestMatch.name} (MovieID: ${movie_id}, Alias: ${alias})`);

    // 4. Fetch the full episode list from Gogo's AJAX (it's very reliable)
    // Default range 0-2000 to get everything
    const epListRes = await axios.get(`${GOGO_AJAX_BASE}/ajax/load-list-episode?ep_start=0&ep_end=2000&id=${movie_id}&default_ep=0&alias=${alias}`);
    const $eps = cheerio.load(epListRes.data);
    
    const episodes = [];
    $eps('li').each((i, el) => {
        const epNum = $(el).find('.name').text().replace('EP ', '').trim();
        const epLink = $(el).find('a').attr('href').trim();
        
        episodes.push({
            episode_number: parseInt(epNum, 10),
            title: `Episode ${epNum}`,
            link: `${GOGO_BASE}${epLink}`,
            data_id: epLink.split('/').pop() // Used to fetch servers
        });
    });

    return episodes.sort((a, b) => a.episode_number - b.episode_number);
  } catch (err) {
    console.error(`[Gogo] Scrape error for ${title}:`, err.message);
    return [];
  }
}

async function fetchGogoServers(episodeDataId) {
    try {
        // episodeDataId is usually "naruto-episode-1"
        const res = await axiosInstance.get(`/${episodeDataId}`);
        const $ = cheerio.load(res.data);
        
        const servers = [];
        $('.anime_muti_link ul li').each((i, el) => {
            const name = $(el).attr('class').replace('anime', '').trim();
            const link = $(el).find('a').attr('data-video');
            
            if (link) {
                servers.push({
                    id: episodeDataId + '-' + name,
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    link: link.startsWith('http') ? link : `https:${link}`,
                    type: 'iframe',
                    custom: true
                });
            }
        });
        
        return servers;
    } catch (err) {
        console.error(`[Gogo] Server fetch error:`, err.message);
        return [];
    }
}

module.exports = { scrapeGogoEpisodes, fetchGogoServers };
