const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://gogoanime3.co';
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  },
});

async function testGogo(query) {
    try {
        console.log(`Searching Gogo for: ${query}`);
        const res = await axiosInstance.get(`/search.html?keyword=${encodeURIComponent(query)}`);
        const $ = cheerio.load(res.data);
        
        console.log('HTML Length:', res.data.length);
        
        const firstMatch = $('.items li .name a').first();
        console.log(`First Match: ${firstMatch.text()} (Link: ${firstMatch.attr('href')})`);

    } catch (err) {
        console.error('Gogo search error:', err.message);
    }
}

testGogo('Frieren');
