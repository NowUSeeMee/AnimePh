const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://hianime.to';
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  },
});

async function testSearch(query) {
    try {
        console.log(`Searching for: ${query}`);
        const res = await axiosInstance.get(`/search?keyword=${encodeURIComponent(query)}`);
        const $ = cheerio.load(res.data);
        
        console.log('HTML Length:', res.data.length);
        
        // Try different selectors
        const selectors = ['.film-detail .dynamic-name', '.film-name .dynamic-name', 'a.dynamic-name', '.flw-item .film-name a'];
        
        selectors.forEach(sel => {
            const match = $(sel).first();
            console.log(`Selector "${sel}": ${match.text() || 'N/A'} (Link: ${match.attr('href') || 'N/A'})`);
        });

    } catch (err) {
        console.error('Search error:', err.message);
    }
}

testSearch('Frieren');
