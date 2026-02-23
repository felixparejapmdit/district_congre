const District = require('../backend/models/District');
const LocalCongregation = require('../backend/models/LocalCongregation');

async function check() {
    try {
        const extras = ['Caribbean', 'Cavite South', 'Florida', 'Leyte East', 'Ottawa', 'Virginia'];
        for (const name of extras) {
            const d = await District.findOne({ where: { name }, include: [LocalCongregation] });
            if (d) {
                console.log(`\n--- District: ${name} (ID: ${d.id}) ---`);
                console.log(`Locale Count: ${d.LocalCongregations.length}`);
                if (d.LocalCongregations.length > 0) {
                    console.log("Sample Locales:", d.LocalCongregations.slice(0, 3).map(l => l.name).join(", "));
                }
            } else {
                console.log(`District ${name} not found.`);
            }
        }
        process.exit(0);
    } catch (error) {
        console.error("Check failed:", error.message);
        process.exit(1);
    }
}

check();
