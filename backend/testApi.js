const axios = require('axios');

async function testApi() {
  try {
    console.log("Testing API fetch for Fullmetal Alchemist: Brotherhood...");
    const url = "http://localhost:5000/api/episodes/5114?title=Fullmetal%20Alchemist:%20Brotherhood&titleEnglish=Fullmetal%20Alchemist:%20Brotherhood";
    const res = await axios.get(url);
    
    console.log(`Success! Fetched ${res.data.length} episodes.`);
    console.log("First 3 episodes:");
    console.log(res.data.slice(0, 3));
  } catch (err) {
    console.error("API request failed:", err.message);
    if(err.response) {
      console.error(err.response.data);
    }
  }
}

testApi();
