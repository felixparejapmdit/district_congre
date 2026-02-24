/**
 * cleanup_stale_locales.js
 *
 * One-time script that:
 *   1. Fetches all ACTIVE locale slugs from the official INC website
 *   2. Marks any local_congregation row whose slug is NOT on the site as is_active=0
 *   3. NEVER deletes any row — all IDs are preserved for linked apps
 *
 * Run: node -r dotenv/config scripts/cleanup_stale_locales.js dotenv_config_path=.env
 */

require('dotenv').config({ path: '.env' });
const axios = require('axios');
const cheerio = require('cheerio');
const { Sequelize, Op } = require('sequelize');

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
const BASE = 'https://iglesianicristo.net/directory';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchDistrictUrls() {
    const res = await axios.get(`${BASE}/districts`, { headers: HEADERS, timeout: 20000 });
    const $ = cheerio.load(res.data);
    const urls = new Set();

    // Same selectors as count_congregations.js
    const selectors = [
        'a[href*="/directory/districts/"]',
        'a[href*="/districts/"]',
        '.mdl-list__item a',
        'li a',
    ];

    for (const sel of selectors) {
        $(sel).each((_, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('/districts/') && href.split('/districts/')[1]?.length > 0) {
                const fullUrl = href.startsWith('http') ? href : `https://iglesianicristo.net${href}`;
                urls.add(fullUrl);
            }
        });
        if (urls.size > 0) break;
    }
    return [...urls];
}

async function fetchLocalesForDistrict(url) {
    try {
        const res = await axios.get(url, { headers: HEADERS, timeout: 15000 });
        const $ = cheerio.load(res.data);
        const slugs = new Set();

        // Same selectors used by count_congregations.js
        const selectors = [
            'a[href*="/directory/locales/"]',
            'a[href*="/locales/"]',
            '.mdl-list__item a',
        ];

        for (const sel of selectors) {
            $(sel).each((_, el) => {
                const href = $(el).attr('href');
                if (href && href.includes('/locales/')) {
                    // Extract the slug = last path segment after /locales/
                    const parts = href.split('/locales/');
                    const slug = parts[1]?.split('/')[0];
                    if (slug) slugs.add(slug);
                }
            });
            if (slugs.size > 0) break;
        }
        return [...slugs];
    } catch {
        return [];
    }
}

async function main() {
    console.log('='.repeat(60));
    console.log('  INC STALE LOCALE CLEANUP — IDs PRESERVED');
    console.log('='.repeat(60));

    await s.authenticate();
    console.log('✅ Database connected.\n');

    // ── Step 1: Count before ──────────────────────────────────────
    const [[before]] = await s.query(
        `SELECT COUNT(*) as cnt FROM local_congregation lc
         INNER JOIN districts d ON lc.district_id = d.id
         WHERE lc.is_active = 1 AND d.is_active = 1`
    );
    console.log(`📊 Current active count (before): ${before.cnt}`);

    // ── Step 2: Collect all live slugs from official site ─────────
    console.log('\n📡 Fetching district list from official INC directory...');
    const districtUrls = await fetchDistrictUrls();
    console.log(`   Found ${districtUrls.length} districts on site.\n`);

    const allLiveSlugs = new Set();
    let processed = 0;

    for (const url of districtUrls) {
        const slugs = await fetchLocalesForDistrict(url);
        slugs.forEach(s => allLiveSlugs.add(s));
        processed++;
        process.stdout.write(`\r   Scraping districts: ${processed}/${districtUrls.length} (${allLiveSlugs.size} slugs so far)`);
        await sleep(250); // polite delay
    }

    console.log(`\n\n✅ Total live slugs from official site: ${allLiveSlugs.size}`);

    if (allLiveSlugs.size < 8000) {
        console.error('❌ Safety check failed: too few slugs collected. Aborting to avoid false deactivation.');
        await s.close();
        process.exit(1);
    }

    // ── Step 3: Deactivate stale locales (slug not on site) ───────
    const slugArr = [...allLiveSlugs];
    console.log('\n🗑️  Marking stale locales as inactive (is_active=0)...');
    console.log('   (No rows will be deleted, all IDs remain intact)');

    const deactResult = await s.query(
        `UPDATE local_congregation 
         SET is_active = 0 
         WHERE slug IS NOT NULL 
           AND is_active = 1 
           AND slug NOT IN (:slugs)`,
        { replacements: { slugs: slugArr } }
    );
    // Sequelize raw query returns [results, metadata] — on MySQL, results IS the affectedRows number
    const deactivatedCount = typeof deactResult[0] === 'number' ? deactResult[0] : (deactResult[0]?.affectedRows ?? 0);
    console.log(`   ✅ Deactivated: ${deactivatedCount} stale locale(s)`);

    // ── Step 4: Also re-activate slugs that ARE on site but were marked inactive ─
    const reactResult = await s.query(
        `UPDATE local_congregation 
         SET is_active = 1 
         WHERE slug IS NOT NULL 
           AND is_active = 0 
           AND slug IN (:slugs)`,
        { replacements: { slugs: slugArr } }
    );
    const reactivatedCount = typeof reactResult[0] === 'number' ? reactResult[0] : (reactResult[0]?.affectedRows ?? 0);
    console.log(`   ✅ Re-activated: ${reactivatedCount} locale(s) found back on site`);

    // ── Step 5: Final count ───────────────────────────────────────
    const [[after]] = await s.query(
        `SELECT COUNT(*) as cnt FROM local_congregation lc
         INNER JOIN districts d ON lc.district_id = d.id
         WHERE lc.is_active = 1 AND d.is_active = 1`
    );

    const [[totalRows]] = await s.query(`SELECT COUNT(*) as cnt FROM local_congregation`);

    console.log('\n' + '='.repeat(60));
    console.log(`  BEFORE cleanup      : ${before.cnt}`);
    console.log(`  AFTER cleanup       : ${after.cnt}`);
    console.log(`  Official INC count  : 8,734`);
    console.log(`  Difference          : ${after.cnt - 8734}`);
    console.log(`  Total rows in DB    : ${totalRows.cnt} (all IDs preserved)`);
    console.log(`  Deactivated         : ${deactivatedCount}`);
    console.log(`  Re-activated        : ${reactivatedCount}`);
    console.log('='.repeat(60));
    console.log('\n✅ Cleanup complete! Dashboard will now reflect the correct count.\n');

    await s.close();
}

main().catch(e => {
    console.error('\n❌ Error:', e.message);
    s.close();
    process.exit(1);
});
