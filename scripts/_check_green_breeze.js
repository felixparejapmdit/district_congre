require('dotenv').config({ path: '.env' });
const { Sequelize } = require('sequelize');
const s = new Sequelize(process.env.MYSQL_DATABASE, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD,
    { host: process.env.MYSQL_HOST, port: process.env.MYSQL_PORT, dialect: 'mysql', logging: false });
s.authenticate().then(async () => {
    const [rows] = await s.query("SELECT lc.id, lc.name, d.name as district, d.is_active as dact FROM local_congregation lc LEFT JOIN districts d ON lc.district_id=d.id WHERE lc.name LIKE '%Green Breeze%'");
    rows.forEach(r => console.log(r.name, '|', r.district, '| district_active:', r.dact));
    await s.close();
}).catch(e => { console.error(e.message); process.exit(1); });
