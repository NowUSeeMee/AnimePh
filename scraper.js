const axios = require("axios");
const cheerio = require("cheerio");

const BASE_URL = "https://aniwatchtv.to";

// We use a User-Agent to prevent the site's anti-bot system from blocking us
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
  }
});

/**
 * Step 1: Scrape the Homepage to get a list of Anime URLs
 */
async function getHomepageAnime() {
  console.log("Fetching homepage...");
  const { data } = await axiosInstance.get("/home");
  const $ = cheerio.load(data);

  const animeList = [];

  // Find the trending/recommended anime blocks
  $(".flw-item").each((i, el) => {
    const title = $(el).find(".dynamic-name").text().trim();
    const link = $(el).find(".dynamic-name").attr("href");
    const image = $(el).find("img").attr("data-src") || $(el).find("img").attr("src");
    
    if (title && link) {
      animeList.push({
        title,
        url: BASE_URL + link,
        image
      });
    }
  });

  return animeList;
}

/**
 * Step 2 & 3: Scrape a specific Anime's Details and its Episode List
 */
async function getAnimeDetailsAndEpisodes(animePath) {
  console.log(`\nFetching details for ${animePath}...`);
  const { data } = await axiosInstance.get(animePath);
  const $ = cheerio.load(data);

  // Parse Anime Details
  const title = $(".anisc-detail .film-name.dynamic-name").text().trim();
  const description = $(".film-description .text").text().trim();
  
  // Parse stats (like TV type, Quality, Sub/Dub counts)
  const stats = [];
  $(".tick-item").each((i, el) => {
    stats.push($(el).text().trim());
  });

  // Extract the unique anime ID needed to fetch the episodes list
  const animeId = $("#syncData").attr("data-id") || animePath.split("-").pop();

  return {
    id: animeId,
    title,
    description,
    stats: stats.join(" | "),
  };
}

/**
 * Main function to tie it all together
 */
async function scrapeAllData() {
  try {
    // 1. Get list of anime from the homepage
    const animeList = await getHomepageAnime();
    console.log(`Found ${animeList.length} anime on the homepage.`);
    
    // We will just scrape the FIRST anime as an example, otherwise it will take forever!
    if (animeList.length > 0) {
      const firstAnime = animeList[0];
      
      // 2. Get details for that specific anime
      // We use .replace(BASE_URL, '') because our axios config already has the baseURL
      const details = await getAnimeDetailsAndEpisodes(firstAnime.url.replace(BASE_URL, ''));
      
      console.log("\n--- SCRAPED DATA ---");
      console.log("Title:", details.title);
      console.log("Stats:", details.stats);
      console.log("Description:", details.description.substring(0, 100) + "...");
    }

  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.error("\n[ERROR] Aniwatch blocked the request (403 Forbidden). Cloudflare or Bot Protection is active.");
    } else {
      console.error("\n[ERROR]", error.message);
    }
  }
}

// Run the script
scrapeAllData();
