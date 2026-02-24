/**
 * check_congregation_counts.js
 * Checks total, active-district only, and orphaned congregation counts
 * Run: node scripts/check_congregation_counts.js
 */

require('dotenv').config({ path: '.env.development.local' });
const { Sequelize, DataTypes, Op } = require('sequelize');

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

        // 1. Total congregations (no filter)
        const [totalResult] = await sequelize.query(
            'SELECT COUNT(*) as cnt FROM local_congregation'
        );
        console.log('TOTAL local_congregation rows        :', totalResult[0].cnt);

        // 2. Congregations under ACTIVE districts
        const [activeResult] = await sequelize.query(`
            SELECT COUNT(lc.id) as cnt
            FROM local_congregation lc
            INNER JOIN districts d ON lc.district_id = d.id
            WHERE d.is_active = 1
        `);
        console.log('Under ACTIVE districts               :', activeResult[0].cnt);

        // 3. Congregations under INACTIVE districts
        const [inactiveResult] = await sequelize.query(`
            SELECT COUNT(lc.id) as cnt
            FROM local_congregation lc
            INNER JOIN districts d ON lc.district_id = d.id
            WHERE d.is_active = 0
        `);
        console.log('Under INACTIVE districts             :', inactiveResult[0].cnt);

        // 4. Orphaned (no district)
        const [orphanResult] = await sequelize.query(`
            SELECT COUNT(lc.id) as cnt
            FROM local_congregation lc
            LEFT JOIN districts d ON lc.district_id = d.id
            WHERE d.id IS NULL
        `);
        console.log('Orphaned (no matching district)      :', orphanResult[0].cnt);

        // 5. Count of active vs inactive districts
        const [districtResult] = await sequelize.query(
            'SELECT is_active, COUNT(*) as cnt FROM districts GROUP BY is_active'
        );
        console.log('\nDistrict breakdown:');
        districtResult.forEach(r => {
            console.log(`  is_active=${r.is_active}: ${r.cnt} districts`);
        });

        // 6. Show inactive district names
        const [inactiveDistricts] = await sequelize.query(
            'SELECT id, name FROM districts WHERE is_active = 0 LIMIT 20'
        );
        if (inactiveDistricts.length > 0) {
            console.log('\nInactive district names (sample):');
            inactiveDistricts.forEach(d => console.log(`  [${d.id}] ${d.name}`));
        }

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await sequelize.close();
    }
}

main();
