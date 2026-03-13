const { scrapeEpisodesForTitle, fetchServers } = require('./scraper');

async function test() {
    const title = 'Sousou no Frieren';
    console.log(`Searching for: ${title}`);
    
    try {
        const episodes = await scrapeEpisodesForTitle(title);
        console.log(`Found ${episodes.length} episodes.`);
        
        if (episodes.length > 0) {
            const ep = episodes[0];
            console.log(`Testing Episode 1 (data_id: ${ep.data_id})`);
            const servers = await fetchServers(ep.data_id);
            console.log('Servers found:', JSON.stringify(servers, null, 2));
        }
    } catch (err) {
        console.error('Test failed:', err);
    }
}

test();
