// Check: does Step 6 accidentally re-deactivate NULL-slug sub-locales?
// In MySQL: NULL NOT IN ('a','b','c') = NULL (treated as true in UPDATE WHERE)
// So any NULL-slug locale in an active district would be caught by Step 6 and set is_active=0
// But since sub-locales are ALREADY is_active=0, the WHERE clause "is_active=true" protects them.
// HOWEVER: after Step 7 reparents a sub-locale to an active district,
// if that sub-locale accidentally gets set is_active=1 somewhere, Step 6 would catch it.
//
// The REAL risk: if INC ever adds an active locale with the same name as a sub-locale,
// Line 239-243 in the sync would find it by name+district, update it with a slug, and set is_active=true.
// Then Step 6 would try to deactivate it again. That's actually correct behavior.
//
// CONCLUSION: The NULL-slug sub-locales are safe because they all have is_active=false already.
// Step 6 filter has: is_active=true AND slug NOT IN (live_slugs)
// Since sub-locales are is_active=false, they are EXCLUDED from Step 6.
//
// BUT: There's still the NULL NOT IN bug in MySQL. Let's test it:
require('dotenv').config({ path: '.env' });
const { Sequelize } = require('sequelize');
const s = new Sequelize(process.env.MYSQL_DATABASE, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD,
    { host: process.env.MYSQL_HOST, port: process.env.MYSQL_PORT, dialect: 'mysql', logging: false });

s.authenticate().then(async () => {
    // Test: would NULL NOT IN catch anything that is is_active=true right now?
    const [[r]] = await s.query(`
        SELECT COUNT(*) as cnt
        FROM local_congregation
        WHERE is_active = 1
          AND slug IS NULL
    `);
    console.log('Active locales with NULL slug (vulnerable to Step 6 bug):', r.cnt);
    // These would be caught by "slug NOT IN (slugs)" because NULL NOT IN = NULL = included in WHERE

    if (r.cnt > 0) {
        console.log('⚠️  These would be incorrectly deactivated by Step 6!');
        const [rows] = await s.query(`SELECT id, name FROM local_congregation WHERE is_active=1 AND slug IS NULL LIMIT 10`);
        rows.forEach(row => console.log(' -', row.name));
    } else {
        console.log('✅ No active NULL-slug locales. Step 6 NULL NOT IN bug has no impact currently.');
    }
    await s.close();
}).catch(e => { console.error(e.message); process.exit(1); });
