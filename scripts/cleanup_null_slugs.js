/**
 * cleanup_null_slugs.js
 *
 * Deactivates local_congregation rows with NULL slugs whose names
 * cannot be matched on the official INC directory.
 *
 * These are typically "Ext." or "GWS" sub-locales that no longer
 * appear as standalone directory entries.
 *
 * SAFE: No rows are deleted. All IDs are preserved.
 *
 * Run: node scripts/cleanup_null_slugs.js
 */

require('dotenv').config({ path: '.env' });
const axios = require('axios');
const cheerio = require('cheerio');
const { Sequelize } = require('sequelize');

const s = new Sequelize(
    process.env.MYSQL_DATABASE || 'discongre',
    process.env.MYSQL_USER || 'discongre',
    process.env.MYSQL_PASSWORD || '',
    {
        host: process.env.MYSQL_HOST || 'localhost',
        port: process.env.MYSQL_PORT || 3306,
        dialect: 'mysql',
        logging: false,
    }
);

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
    console.log('='.repeat(60));
    console.log('  NULL-SLUG LOCALE CLEANUP');
    console.log('='.repeat(60));

    await s.authenticate();
    console.log('✅ Connected.\n');

    // Count before
    const [[before]] = await s.query(
        `SELECT COUNT(*) as cnt FROM local_congregation lc
         INNER JOIN districts d ON lc.district_id = d.id
         WHERE lc.is_active = 1 AND d.is_active = 1`
    );
    console.log(`📊 Active locales (before): ${before.cnt}`);

    // Count NULL-slug active rows
    const [[nullCount]] = await s.query(
        `SELECT COUNT(*) as cnt FROM local_congregation WHERE is_active=1 AND slug IS NULL`
    );
    console.log(`🔍 Active rows with NULL slug: ${nullCount.cnt}`);

    // Collect all official locale names from the site for cross-checking
    console.log('\n📡 Collecting official locale names for matching...');
    const res = await axios.get('https://iglesianicristo.net/directory/districts', { headers: HEADERS, timeout: 20000 });
    const $ = cheerio.load(res.data);

    const districtUrls = [];
    const distSelectors = [
        'a[href*="/directory/districts/"]',
        'a[href*="/districts/"]',
    ];
    for (const sel of distSelectors) {
        $(sel).each((_, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('/districts/') && href.split('/districts/')[1]?.length > 0) {
                districtUrls.push(href.startsWith('http') ? href : 'https://iglesianicristo.net' + href);
            }
        });
        if (districtUrls.length > 0) break;
    }

    const officialNames = new Set();
    let done = 0;
    for (const url of districtUrls) {
        try {
            const dr = await axios.get(url, { headers: HEADERS, timeout: 12000 });
            const $d = cheerio.load(dr.data);
            const locSelectors = [
                'a[href*="/directory/locales/"]',
                'a[href*="/locales/"]',
            ];
            for (const sel of locSelectors) {
                $d(sel).each((_, el) => {
                    const name = $d(el).text().trim().toUpperCase();
                    if (name) officialNames.add(name);
                });
                if (officialNames.size > done) break;
            }
        } catch { /* skip */ }
        done++;
        process.stdout.write(`\r   Districts scraped: ${done}/${districtUrls.length} (${officialNames.size} names)`);
        await sleep(250);
    }
    console.log(`\n\n✅ Official locale names collected: ${officialNames.size}`);

    // Get all NULL-slug active rows
    const [nullRows] = await s.query(
        `SELECT id, name FROM local_congregation WHERE is_active=1 AND slug IS NULL`
    );

    // Deactivate rows whose name is NOT in the official name set
    const toDeactivate = nullRows
        .filter(r => !officialNames.has(r.name?.toUpperCase()))
        .map(r => r.id);

    console.log(`\n🗑️  NULL-slug rows NOT found on official site: ${toDeactivate.length}`);

    if (toDeactivate.length > 0) {
        await s.query(
            `UPDATE local_congregation SET is_active=0 WHERE id IN (:ids)`,
            { replacements: { ids: toDeactivate } }
        );
        console.log(`   ✅ Deactivated ${toDeactivate.length} unmatched NULL-slug locales`);
    }

    // Final count
    const [[after]] = await s.query(
        `SELECT COUNT(*) as cnt FROM local_congregation lc
         INNER JOIN districts d ON lc.district_id = d.id
         WHERE lc.is_active = 1 AND d.is_active = 1`
    );
    const [[totalRows]] = await s.query(`SELECT COUNT(*) as cnt FROM local_congregation`);

    console.log('\n' + '='.repeat(60));
    console.log(`  BEFORE           : ${before.cnt}`);
    console.log(`  AFTER            : ${after.cnt}`);
    console.log(`  Official count   : 8,734`);
    console.log(`  Difference       : ${after.cnt - 8734}`);
    console.log(`  Total DB rows    : ${totalRows.cnt} (IDs preserved)`);
    console.log('='.repeat(60));
    console.log('\n✅ Done!\n');

    await s.close();
}

main().catch(async e => {
    console.error('❌', e.message);
    await s.close();
    process.exit(1);
});
