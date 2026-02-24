const { District, LocalCongregation } = require('../backend/models');
const { Op } = require('sequelize');

async function audit() {
    try {
        console.log('--- Database Audit ---');

        const totalDistricts = await District.count();
        const activeDistricts = await District.count({ where: { is_active: true } });
        console.log(`Districts: ${totalDistricts} total, ${activeDistricts} active`);

        const totalLocales = await LocalCongregation.count();
        const activeLocales = await LocalCongregation.count({ where: { is_active: true } });
        console.log(`Locales: ${totalLocales} total, ${activeLocales} active`);

        // Check active locales by slug presence
        const activeWithSlug = await LocalCongregation.count({ where: { is_active: true, slug: { [Op.ne]: null } } });
        const activeNoSlug = await LocalCongregation.count({ where: { is_active: true, slug: null } });
        console.log(`Active locales: ${activeWithSlug} with slug, ${activeNoSlug} without slug`);

        // Check active locales under inactive districts
        const activeInInactiveDistrict = await LocalCongregation.count({
            where: { is_active: true },
            include: [{
                model: District,
                where: { is_active: false },
                required: true
            }]
        });
        console.log(`Active locales under inactive districts: ${activeInInactiveDistrict}`);

        // Check sub-locales (Ext/GWS)
        const totalExt = await LocalCongregation.count({ where: { name: { [Op.like]: '%Ext.%' } } });
        const activeExt = await LocalCongregation.count({ where: { name: { [Op.like]: '%Ext.%' }, is_active: true } });
        console.log(`Extensions: ${totalExt} total, ${activeExt} active`);

        const totalGWS = await LocalCongregation.count({
            where: {
                name: { [Op.or]: [{ [Op.like]: '%GWS%' }, { [Op.like]: '%Group Worship%' }] }
            }
        });
        const activeGWS = await LocalCongregation.count({
            where: {
                name: { [Op.or]: [{ [Op.like]: '%GWS%' }, { [Op.like]: '%Group Worship%' }] },
                is_active: true
            }
        });
        console.log(`GWS: ${totalGWS} total, ${activeGWS} active`);

        // Discrepancy check: any active locale whose slug was NOT in the last sync?
        // We can't know for sure what was on the site without scraping, 
        // but we can check for recent updates.
        const updatedToday = await LocalCongregation.count({
            where: { is_active: true, updatedAt: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) } }
        });
        console.log(`Active locales updated today: ${updatedToday}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

audit();
