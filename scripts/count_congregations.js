/**
 * count_congregations.js
 * Scrapes the official INC directory to count all districts and
 * all local congregations listed under each district.
 * 
 * Run: node scripts/count_congregations.js
 */

const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://iglesianicristo.net/directory';
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchPage(url) {
    try {
        const res = await axios.get(url, { headers: HEADERS, timeout: 20000 });
        return res.data;
    } catch (e) {
        console.warn(`  [WARN] Failed: ${url} — ${e.message}`);
        return null;
    }
}

async function getDistricts() {
    console.log('\n📡 Fetching districts list from:', `${BASE_URL}/districts`);
    const html = await fetchPage(`${BASE_URL}/districts`);
    if (!html) {
        console.error('❌ Could not load districts page.');
        process.exit(1);
    }

    const $ = cheerio.load(html);
    const districts = [];

    // Try multiple selectors for district links
    const selectors = [
        'a[href*="/directory/districts/"]',
        'a[href*="/districts/"]',
        '.mdl-list__item a',
        'li a',
    ];

    for (const sel of selectors) {
        $(sel).each((_, el) => {
            const href = $(el).attr('href');
            const name = $(el).text().trim();
            if (href && name && !districts.find(d => d.href === href)) {
                // Ensure it's a district detail page (not the list itself)
                if (href.includes('/districts/') && href.split('/districts/')[1]?.length > 0) {
                    const fullUrl = href.startsWith('http') ? href : `https://iglesianicristo.net${href}`;
                    districts.push({ name, href: fullUrl });
                }
            }
        });
        if (districts.length > 0) break;
    }

    // Fallback: dump all links for debugging
    if (districts.length === 0) {
        console.log('\n⚠️  No districts found with standard selectors. Dumping all links found:');
        $('a').each((_, el) => {
            const href = $(el).attr('href') || '';
            const text = $(el).text().trim();
            if (text) console.log(`  ${text} => ${href}`);
        });
    }

    return districts;
}

async function getCongregationsInDistrict(districtUrl, districtName) {
    const html = await fetchPage(districtUrl);
    if (!html) return 0;

    const $ = cheerio.load(html);
    let count = 0;

    // Try multiple selectors for locale/congregation links
    const selectors = [
        'a[href*="/directory/locales/"]',
        'a[href*="/locales/"]',
        '.mdl-list__item a',
    ];

    const found = new Set();
    for (const sel of selectors) {
        $(sel).each((_, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('/locales/') && !found.has(href)) {
                found.add(href);
            }
        });
        if (found.size > 0) break;
    }

    count = found.size;
    console.log(`  ✅ ${districtName.padEnd(50)} → ${count} locales`);
    return count;
}

async function main() {
    console.log('='.repeat(65));
    console.log('  INC OFFICIAL DIRECTORY — CONGREGATION COUNT CHECK');
    console.log('='.repeat(65));

    const districts = await getDistricts();
    console.log(`\n📋 Found ${districts.length} district(s) listed.\n`);

    if (districts.length === 0) {
        // Fallback: try the old directory URL
        console.log('Trying alternate URL: https://directory.iglesianicristo.net/districts ...');
        const html2 = await fetchPage('https://directory.iglesianicristo.net/districts');
        if (html2) {
            const $ = cheerio.load(html2);
            const links = new Set();
            $('a').each((_, el) => {
                const href = $(el).attr('href') || '';
                const text = $(el).text().trim();
                if (href && text) links.add(`${text} => ${href}`);
            });
            console.log('\nAll links on alt URL:');
            links.forEach(l => console.log(' ', l));
        }
        return;
    }

    let totalLocales = 0;
    let districtsDone = 0;

    console.log('Counting congregations in each district...\n');

    for (const district of districts) {
        const count = await getCongregationsInDistrict(district.href, district.name);
        totalLocales += count;
        districtsDone++;
        // Polite delay to avoid rate limiting
        await sleep(300);
    }

    console.log('\n' + '='.repeat(65));
    console.log(`  ✅ TOTAL DISTRICTS   : ${districtsDone}`);
    console.log(`  ✅ TOTAL LOCALES     : ${totalLocales}`);
    console.log('='.repeat(65));
    console.log('\nDone! These counts are from the OFFICIAL INC directory website.\n');
}

main().catch(console.error);
