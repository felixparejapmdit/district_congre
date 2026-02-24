const { LocalCongregation, District } = require('../backend/models');
const { Op } = require('sequelize');

async function fixData() {
    try {
        console.log('--- Starting Data Alignment Fix ---');

        // 1. First, ensure all sub-locales (Ext/GWS) are marked as inactive
        //    (They should be inactive because they aren't on the official top-level list)
        const [subLocales] = await LocalCongregation.update(
            { is_active: false },
            {
                where: {
                    [Op.or]: [
                        { name: { [Op.like]: '%Ext.%' } },
                        { name: { [Op.like]: '%Extension%' } },
                        { name: { [Op.like]: '%GWS%' } },
                        { name: { [Op.like]: '%Group Worship%' } }
                    ]
                }
            }
        );
        console.log(`✅ Fixed ${subLocales} sub-locales (set to inactive)`);

        // 2. Deactivate any locale under a retired district
        const [retiredDistricts] = await LocalCongregation.update(
            { is_active: false },
            {
                where: { is_active: true },
                include: [{
                    model: District,
                    where: { is_active: false },
                    required: true
                }]
            }
        ).catch(async () => {
            // Fallback to raw query if include update fails
            const sequelize = require('../backend/config/database');
            return await sequelize.query(`
                UPDATE local_congregation lc
                INNER JOIN districts d ON lc.district_id = d.id
                SET lc.is_active = 0
                WHERE lc.is_active = 1 AND d.is_active = 0
             `);
        });
        console.log(`✅ Deactivated locales under retired districts`);

        // 3. Deactivate locales that haven't been updated in the last 2 hours 
        //    (Assuming a full sync just finished)
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const [stale] = await LocalCongregation.update(
            { is_active: false },
            {
                where: {
                    is_active: true,
                    slug: { [Op.ne]: null },
                    updatedAt: { [Op.lt]: twoHoursAgo }
                }
            }
        );
        console.log(`✅ Deactivated ${stale} stale active locales (not seen in last sync)`);

        console.log('--- Cleanup Complete ---');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixData();
