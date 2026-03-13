const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://aniwatchtv.by'; 

// Shared instance to mimic browser behavior
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  },
});

/**
 * Helper to fetch episode list for an anime id directly from Aniwatch's AJAX endpoint
 * @param {string} animeId 
 */
async function fetchEpisodesFromId(animeId) {
  try {
    const res = await axiosInstance.get(`/ajax/v2/episode/list/${animeId}`);
    if (!res.data || !res.data.html) {
      throw new Error("No HTML data returned from source AJAX endpoint");
    }

    const $ = cheerio.load(res.data.html);
    const episodes = [];

    // The HTML returned contains <a> tags for each episode
    $('.ep-item').each((i, el) => {
      const epNum = $(el).attr('data-number');
      const title = $(el).attr('title');
      const dataId = $(el).attr('data-id'); 
      const link = `${BASE_URL}/watch/${animeId}?ep=${dataId}`; // Constructed watch link

      if (epNum && title) {
        episodes.push({
          episode_number: parseInt(epNum, 10),
          title: title.trim(),
          link: link,
          data_id: dataId // Store the internal ID for server fetching
        });
      }
    });

    return episodes;
  } catch (err) {
    console.error(`Failed to fetch episodes for anime ID ${animeId}:`, err.message);
    return [];
  }
}

/**
 * Main export: searches for anime by title, finds the best match, and scrapes episodes
 * @param {string} title - The title of the anime to search for (Romaji/Default)
 * @param {string} titleEnglish - Fallback English title
 * @returns {Array} List of episodes scraped
 */
async function scrapeEpisodesForTitle(title, titleEnglish) {
  try {
    const titlesToTry = [title];
    if (titleEnglish && titleEnglish !== title && titleEnglish !== 'null' && titleEnglish !== 'undefined') {
        titlesToTry.push(titleEnglish);
    }

    for (const searchTitle of titlesToTry) {
        console.log(`[Scraper] Searching provider for: ${searchTitle}`);
        
        // 1. Search for the anime
        const searchRes = await axiosInstance.get(`/search?keyword=${encodeURIComponent(searchTitle)}`);
        const $ = cheerio.load(searchRes.data);

        // 2. Find the first match (usually the most relevant)
        const firstMatch = $('.film-detail .dynamic-name').first();
        const link = firstMatch.attr('href');
        
        if (link) {
            // 3. Extract the ID from the link (e.g., /watch/naruto-shippuden-355 -> 355)
            // Strip any query params like ?ref=search
            const animeId = link.split('?')[0].split('-').pop();
            
            console.log(`[Scraper] Found match: ${firstMatch.text()} (ID: ${animeId}). Fetching episodes...`);

            // 4. Hit the AJAX endpoint to get the full episode list for that ID
            const episodes = await fetchEpisodesFromId(animeId);
            console.log(`[Scraper] Successfully scraped ${episodes.length} episodes for ${searchTitle}`);
            
            return episodes;
        } else {
            console.log(`[Scraper] Could not find any anime matching: ${searchTitle}`);
        }
    }

    // If loop finishes without returning, we found nothing
    console.log(`[Scraper] Failed to find anime after trying all titles.`);
    return [];

  } catch (error) {
    console.error(`[Scraper] Error scraping episodes:`, error.message);
    return [];
  }
}

/**
 * Fetches the list of available servers (Sub/Dub) for an episode ID
 * @param {string} episodeId 
 */
async function fetchServers(episodeId) {
  try {
    const res = await axiosInstance.get(`/ajax/v2/episode/servers?episodeId=${episodeId}`);
    if (!res.data || !res.data.html) {
      throw new Error("No HTML data returned for servers");
    }

    const $ = cheerio.load(res.data.html);
    const servers = { sub: [], dub: [] };

    $('.servers-sub .server-item').each((i, el) => {
      let serverName = $(el).find('.btn').text().trim() || $(el).text().trim();
      
      // Aniwatch Style Server Name Normalization
      if (serverName.toLowerCase().includes('aniwatch')) {
          serverName = 'HD Server';
      } else if (serverName.toLowerCase().includes('rapid') || serverName.toLowerCase().includes('vidstreaming')) {
          serverName = 'T-Cloud'; // Map RapidCloud/VidStreaming to T-Cloud
      }

      servers.sub.push({
        id: $(el).attr('data-id'),
        name: serverName,
        serverId: $(el).attr('data-server-id')
      });
    });

    $('.servers-dub .server-item').each((i, el) => {
      let serverName = $(el).find('.btn').text().trim() || $(el).text().trim();
      
      // Aniwatch Style Server Name Normalization
      if (serverName.toLowerCase().includes('aniwatch')) {
          serverName = 'HD Server';
      } else if (serverName.toLowerCase().includes('rapid') || serverName.toLowerCase().includes('vidstreaming')) {
          serverName = 'T-Cloud'; // Map RapidCloud/VidStreaming to T-Cloud
      }
      
      servers.dub.push({
        id: $(el).attr('data-id'),
        name: serverName,
        serverId: $(el).attr('data-server-id')
      });
    });

    return servers;
  } catch (err) {
    console.error(`Failed to fetch servers for episode ${episodeId}:`, err.message);
    return { sub: [], dub: [] };
  }
}

/**
 * Fetches the source embed link for a given server item ID
 * @param {string} serverId 
 */
async function fetchSources(serverId) {
  try {
    const res = await axiosInstance.get(`/ajax/v2/episode/sources?id=${serverId}`);
    return res.data; // Usually contains { type: 'iframe', link: '...' }
  } catch (err) {
    console.error(`Failed to fetch source for server ${serverId}:`, err.message);
    return null;
  }
}

module.exports = {
  scrapeEpisodesForTitle,
  fetchServers,
  fetchSources
};
