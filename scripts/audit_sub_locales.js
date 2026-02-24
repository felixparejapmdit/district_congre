/**
 * audit_sub_locales.js
 * Checks the accuracy of district_id assignments for NULL-slug (Ext./GWS) locales.
 *
 * Run: node scripts/audit_sub_locales.js
 */

require('dotenv').config({ path: '.env' });
const { Sequelize } = require('sequelize');

const s = new Sequelize(
    process.env.MYSQL_DATABASE,
    process.env.MYSQL_USER,
    process.env.MYSQL_PASSWORD,
    { host: process.env.MYSQL_HOST, port: process.env.MYSQL_PORT, dialect: 'mysql', logging: false }
);

async function main() {
    await s.authenticate();
    console.log('Connected.\n');

    // 1. Ext. locales
    const [extRows] = await s.query(`
        SELECT lc.id, lc.name, lc.district_id, lc.slug, d.name AS district_name, d.is_active AS dist_active
        FROM local_congregation lc
        LEFT JOIN districts d ON lc.district_id = d.id
        WHERE (lc.name LIKE '%Ext.%' OR lc.name LIKE '%Extension%')
          AND lc.is_active = 0
        ORDER BY lc.name
    `);

    // 2. GWS locales
    const [gwsRows] = await s.query(`
        SELECT lc.id, lc.name, lc.district_id, lc.slug, d.name AS district_name, d.is_active AS dist_active
        FROM local_congregation lc
        LEFT JOIN districts d ON lc.district_id = d.id
        WHERE (lc.name LIKE '%GWS%' OR lc.name LIKE '%Group Worship%')
          AND lc.is_active = 0
        ORDER BY lc.name
    `);

    const analyze = (rows, label) => {
        const noDistrict = rows.filter(r => !r.district_name);
        const inactiveDistrict = rows.filter(r => r.district_name && r.dist_active === 0);
        const activeDistrict = rows.filter(r => r.district_name && r.dist_active === 1);
        const withSlug = rows.filter(r => r.slug);

        console.log(`=== ${label} ===`);
        console.log(`Total:                     ${rows.length}`);
        console.log(`With NULL district_id:     ${noDistrict.length}`);
        console.log(`Under inactive district:   ${inactiveDistrict.length}`);
        console.log(`Under active district:     ${activeDistrict.length}`);
        console.log(`With a slug (surprise!):   ${withSlug.length}`);

        if (noDistrict.length > 0) {
            console.log('\nSamples with NO district:');
            noDistrict.slice(0, 5).forEach(r => console.log(`  id=${r.id} | ${r.name}`));
        }
        if (withSlug.length > 0) {
            console.log('\nSamples WITH a slug (unexpected):');
            withSlug.slice(0, 5).forEach(r => console.log(`  id=${r.id} | ${r.name} | slug=${r.slug}`));
        }
        console.log('');
    };

    analyze(extRows, 'EXTENSION LOCALES (Ext.)');
    analyze(gwsRows, 'GROUP WORSHIP SERVICES (GWS)');

    // 3. District distribution for Ext.
    const [extDist] = await s.query(`
        SELECT d.name AS district, COUNT(*) AS cnt
        FROM local_congregation lc
        INNER JOIN districts d ON lc.district_id = d.id
        WHERE (lc.name LIKE '%Ext.%' OR lc.name LIKE '%Extension%')
          AND lc.is_active = 0
        GROUP BY d.name
        ORDER BY cnt DESC
        LIMIT 10
    `);
    console.log('Top 10 districts for Ext. locales:');
    extDist.forEach(r => console.log(`  ${r.district.padEnd(50)} ${r.cnt}`));

    console.log('');
    // 4. District distribution for GWS
    const [gwsDist] = await s.query(`
        SELECT d.name AS district, COUNT(*) AS cnt
        FROM local_congregation lc
        INNER JOIN districts d ON lc.district_id = d.id
        WHERE (lc.name LIKE '%GWS%' OR lc.name LIKE '%Group Worship%')
          AND lc.is_active = 0
        GROUP BY d.name
        ORDER BY cnt DESC
        LIMIT 10
    `);
    console.log('Top 10 districts for GWS locales:');
    gwsDist.forEach(r => console.log(`  ${r.district.padEnd(50)} ${r.cnt}`));

    await s.close();
}

main().catch(async e => { console.error(e.message); await s.close(); process.exit(1); });
