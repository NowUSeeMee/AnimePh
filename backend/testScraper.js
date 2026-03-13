const { fetchServers, fetchSources } = require('./scraper');

async function test() {
    const episodeId = '162345'; 
    try {
        const servers = await fetchServers(episodeId);
        console.log('--- Servers ---');
        console.log(JSON.stringify(servers, null, 2));
        
        console.log('\n--- Sources (SUB) ---');
        for (const s of servers.sub) {
            const source = await fetchSources(s.id);
            console.log(`Server: ${s.name} (ID: ${s.id})`);
            console.log(`Link: ${source?.link}`);
            console.log('---');
        }
    } catch (err) {
        console.error('Test failed:', err);
    }
}

test();
