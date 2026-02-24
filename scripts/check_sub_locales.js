/**
 * check_sub_locales.js
 * Reports counts of Ext. (extension) and GWS (group worship service) locales
 * and finds the 3 slugs on the official site not in the active DB records.
 *
 * Run: node scripts/check_sub_locales.js
 */

require('dotenv').config({ path: '.env' });
const axios = require('axios');
const cheerio = require('cheerio');
const { Sequelize } = require('sequelize');

const s = new Sequelize(
    process.env.MYSQL_DATABASE || 'discongre',
    process.env.MYSQL_USER || 'discongre',
    process.env.MYSQL_PASSWORD || '',
    { host: process.env.MYSQL_HOST || 'localhost', port: process.env.MYSQL_PORT || 3306, dialect: 'mysql', logging: false }
);

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
    await s.authenticate();
    console.log('Connected.\n');

    // ── 1. Sub-locale counts ─────────────────────────────────────────
    const [[extAll]] = await s.query("SELECT COUNT(*) as cnt FROM local_congregation WHERE name LIKE '%Ext.%' OR name LIKE '%Extension%'");
    const [[extInact]] = await s.query("SELECT COUNT(*) as cnt FROM local_congregation WHERE (name LIKE '%Ext.%' OR name LIKE '%Extension%') AND is_active=0");
    const [[gwsAll]] = await s.query("SELECT COUNT(*) as cnt FROM local_congregation WHERE name LIKE '%GWS%' OR name LIKE '%Group Worship%'");
    const [[gwsInact]] = await s.query("SELECT COUNT(*) as cnt FROM local_congregation WHERE (name LIKE '%GWS%' OR name LIKE '%Group Worship%') AND is_active=0");
    const [[totalInact]] = await s.query("SELECT COUNT(*) as cnt FROM local_congregation WHERE is_active=0");
    const [[totalActive]] = await s.query("SELECT COUNT(*) as cnt FROM local_congregation lc INNER JOIN districts d ON lc.district_id=d.id WHERE lc.is_active=1 AND d.is_active=1");

    console.log('=== SUB-LOCALE COUNTS (for Dashboard display) ===');
    console.log('Extension locales (Ext.)   - Total:', extAll.cnt, '| Inactive (deactivated):', extInact.cnt);
    console.log('Group Worship Services (GWS) - Total:', gwsAll.cnt, '| Inactive:', gwsInact.cnt);
    console.log('All inactive rows:', totalInact.cnt);
    console.log('Currently active (all filters):', totalActive.cnt);

    // ── 2. Find the 3 missing slugs (on site but not in DB) ─────────
    console.log('\n=== FINDING 3 MISSING SLUGS FROM OFFICIAL SITE ===');
    console.log('Scraping official directory...');

    const res = await axios.get('https://iglesianicristo.net/directory/districts', { headers: HEADERS, timeout: 20000 });
    const $ = cheerio.load(res.data);

    const districtUrls = [];
    $('a').each((_, el) => {
        const href = $(el).attr('href') || '';
        if (href.includes('/directory/districts/') && href.split('/districts/')[1]?.length > 0) {
            const full = href.startsWith('http') ? href : 'https://iglesianicristo.net' + href;
            if (!districtUrls.includes(full)) districtUrls.push(full);
        }
    });

    // Get all active slugs from DB
    const [activeRows] = await s.query("SELECT slug FROM local_congregation WHERE is_active=1 AND slug IS NOT NULL");
    const dbSlugs = new Set(activeRows.map(r => r.slug));
    console.log('Active DB slugs:', dbSlugs.size);

    // Collect all live slugs from site
    const liveSlugs = new Set();
    let done = 0;
    for (const url of districtUrls) {
        try {
            const dr = await axios.get(url, { headers: HEADERS, timeout: 12000 });
            const $d = cheerio.load(dr.data);
            $d('a').each((_, el) => {
                const href = $d(el).attr('href') || '';
                if (href.includes('/locales/')) {
                    const slug = href.split('/locales/')[1]?.split('/')[0];
                    if (slug) liveSlugs.add(slug);
                }
            });
        } catch { /* skip */ }
        done++;
        process.stdout.write(`\r   Scraped: ${done}/${districtUrls.length} districts`);
        await sleep(250);
    }
    console.log('\nLive slugs from site:', liveSlugs.size);

    // Which live slugs are NOT in the DB?
    const missing = [...liveSlugs].filter(slug => !dbSlugs.has(slug));
    console.log(`\n❗ Slugs on official site NOT in your active DB (${missing.length}):`);
    missing.forEach(slug => console.log(' -', slug));

    // Which DB slugs are NOT on the live site?
    const extra = [...dbSlugs].filter(slug => !liveSlugs.has(slug));
    console.log(`\n❗ Active DB slugs NOT on the official site (${extra.length}):`);
    extra.slice(0, 20).forEach(slug => console.log(' -', slug));

    await s.close();
}

main().catch(async e => { console.error(e.message); await s.close(); process.exit(1); });
