const axios = require('axios');
const cheerio = require('cheerio');
const District = require('../backend/models/District');

async function compare() {
    try {
        console.log("Fetching official districts...");
        const res = await axios.get('https://directory.iglesianicristo.net/districts', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        const officialNames = $('.mdl-list_item a.weight-700').map((i, el) => $(el).text().trim()).get();
        console.log("Official Count:", officialNames.length);

        const dbDistricts = await District.findAll({ order: [['name', 'ASC']] });
        const dbNames = dbDistricts.map(d => d.name);
        console.log("DB Count:", dbNames.length);

        const missingInDb = officialNames.filter(name => !dbNames.includes(name));
        const extraInDb = dbNames.filter(name => !officialNames.includes(name));

        console.log("\n--- Missing in DB (Official but not in DB) ---");
        console.log(missingInDb);

        console.log("\n--- Extra in DB (In DB but not Official) ---");
        console.log(extraInDb);

        process.exit(0);
    } catch (error) {
        console.error("Comparison failed:", error.message);
        process.exit(1);
    }
}

compare();
