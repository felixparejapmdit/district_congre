/**
 * investigate_extras.js
 * Identifies extra local_congregation rows vs what's on the official INC site
 * 
 * Run: node -r dotenv/config scripts/investigate_extras.js dotenv_config_path=.env
 */

require('dotenv').config({ path: '.env' });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
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

async function main() {
    try {
        await sequelize.authenticate();
        console.log('Connected.\n');

        // 1. Check for exact duplicate names within the same district
        const [dupesSameDist] = await sequelize.query(`
            SELECT district_id, name, COUNT(*) as cnt
            FROM local_congregation
            GROUP BY district_id, name
            HAVING cnt > 1
            ORDER BY cnt DESC
            LIMIT 30
        `);
        console.log(`\n🔴 EXACT DUPLICATES (same name, same district): ${dupesSameDist.length} groups`);
        if (dupesSameDist.length > 0) {
            let totalDupeRows = 0;
            dupesSameDist.forEach(r => {
                totalDupeRows += (r.cnt - 1);
                console.log(`  district_id=${r.district_id}  "${r.name}"  x${r.cnt}`);
            });
            console.log(`  → Extra rows from same-district dupes: ${totalDupeRows}`);
        }

        // 2. Check for same name across any district (cross-district dupes)
        const [crossDupes] = await sequelize.query(`
            SELECT name, COUNT(*) as cnt, GROUP_CONCAT(district_id) as districts
            FROM local_congregation
            GROUP BY name
            HAVING cnt > 1
            ORDER BY cnt DESC
            LIMIT 20
        `);
        console.log(`\n🟡 CROSS-DISTRICT SAME NAME: ${crossDupes.length} name groups`);
        crossDupes.slice(0, 10).forEach(r => {
            console.log(`  "${r.name}" appears ${r.cnt}x  (districts: ${r.districts})`);
        });

        // 3. Count by district — spot outlier districts with too many
        const [perDistrict] = await sequelize.query(`
            SELECT d.name as district, d.is_active, COUNT(lc.id) as locale_count
            FROM districts d
            LEFT JOIN local_congregation lc ON lc.district_id = d.id
            GROUP BY d.id, d.name, d.is_active
            ORDER BY locale_count DESC
            LIMIT 20
        `);
        console.log(`\n📊 TOP 20 DISTRICTS BY LOCALE COUNT:`);
        perDistrict.forEach(r => {
            const flag = r.is_active ? '' : ' ⛔ INACTIVE';
            console.log(`  ${String(r.locale_count).padStart(4)}  ${r.district}${flag}`);
        });

        // 4. Check duplicate slugs
        const [dupeSlugs] = await sequelize.query(`
            SELECT slug, COUNT(*) as cnt
            FROM local_congregation
            WHERE slug IS NOT NULL
            GROUP BY slug
            HAVING cnt > 1
            ORDER BY cnt DESC
            LIMIT 20
        `);
        console.log(`\n🔵 DUPLICATE SLUGS: ${dupeSlugs.length} groups`);
        dupeSlugs.slice(0, 10).forEach(r => {
            console.log(`  slug="${r.slug}" x${r.cnt}`);
        });

        // 5. Summary
        const [totalRows] = await sequelize.query('SELECT COUNT(*) as cnt FROM local_congregation');
        const [activeRows] = await sequelize.query(`
            SELECT COUNT(lc.id) as cnt FROM local_congregation lc
            INNER JOIN districts d ON lc.district_id = d.id WHERE d.is_active = 1
        `);
        const sameDupeTotal = dupesSameDist.reduce((s, r) => s + (r.cnt - 1), 0);

        console.log('\n' + '='.repeat(55));
        console.log(`  Total rows           : ${totalRows[0].cnt}`);
        console.log(`  Under active districts: ${activeRows[0].cnt}`);
        console.log(`  Official INC count   : 8,734`);
        console.log(`  Gap (active vs site) : ${activeRows[0].cnt - 8734}`);
        console.log(`  Exact dupes in DB    : ${sameDupeTotal}`);
        console.log('='.repeat(55));

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await sequelize.close();
    }
}

main();
