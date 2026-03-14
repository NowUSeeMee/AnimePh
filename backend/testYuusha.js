const { scrapeEpisodesForTitle } = require('./scraper');

async function test() {
    const title = 'Yuusha-kei ni Shosu: Choubatsu Yuusha 9004-tai Keimu Kiroku';
    const english = 'Sentenced to Be a Hero';
    
    console.log(`[Test] Searching for: ${title}`);
    const eps = await scrapeEpisodesForTitle(title, english);
    console.log(`[Test] Result: ${eps.length} episodes found.`);
    if (eps.length > 0) {
        console.log(`[Test] First episode link: ${eps[0].link}`);
    }
}

test();
