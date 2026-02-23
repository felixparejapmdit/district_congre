const District = require('../backend/models/District');
const LocalCongregation = require('../backend/models/LocalCongregation');
const { Op } = require('sequelize');

async function check() {
    try {
        const extras = ['Caribbean', 'Cavite South', 'Florida', 'Leyte East', 'Ottawa', 'Virginia'];
        for (const name of extras) {
            const d = await District.findOne({ where: { name }, include: [LocalCongregation] });
            if (!d) continue;

            console.log(`\n--- ${name} (${d.LocalCongregations.length} locales) ---`);
            let duplicates = 0;
            for (const l of d.LocalCongregations) {
                const dup = await LocalCongregation.findOne({
                    where: {
                        name: l.name,
                        district_id: { [Op.ne]: d.id }
                    }
                });
                if (dup) duplicates++;
            }
            console.log(`Verified duplicates: ${duplicates}/${d.LocalCongregations.length}`);
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

check();
