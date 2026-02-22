const axios = require('axios');
const cheerio = require('cheerio');

async function checkCount() {
    try {
        const url = 'https://directory.iglesianicristo.net/districts';
        const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(response.data);

        const allLinks = $('a');
        console.log('Total Links:', allLinks.length);

        const districtLinks = $('.mdl-list_item a.weight-700');
        console.log('District Links (weight-700):', districtLinks.length);

        const possibleDistricts = $('a[href*="/districts/"]');
        console.log('Links containing /districts/:', possibleDistricts.length);

        // Let's see some names of the 198
        const names = [];
        districtLinks.each((i, el) => {
            names.push($(el).text().trim());
        });

        console.log('First 5:', names.slice(0, 5));
        console.log('Last 5:', names.slice(-5));

    } catch (e) {
        console.error(e.message);
    }
}

checkCount();
