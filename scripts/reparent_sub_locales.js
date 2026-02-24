/**
 * reparent_sub_locales.js
 *
 * For every inactive Ext. / GWS locale with a NULL slug, this script:
 *   1. Derives the "parent name" by stripping Ext./GWS suffixes
 *   2. Finds the currently-active locale with that base name
 *   3. Updates the sub-locale's district_id to match the parent's current district
 *
 * This fixes cases like "Green Breeze Ext." which was still under "Cavite South"
 * even after "Green Breeze" moved to "Dasmarinas City, Cavite".
 *
 * SAFE: No rows are deleted. Only district_id is updated.
 *
 * Run: node scripts/reparent_sub_locales.js
 */

require('dotenv').config({ path: '.env' });
const { Sequelize } = require('sequelize');

const s = new Sequelize(
    process.env.MYSQL_DATABASE,
    process.env.MYSQL_USER,
    process.env.MYSQL_PASSWORD,
    { host: process.env.MYSQL_HOST, port: process.env.MYSQL_PORT, dialect: 'mysql', logging: false }
);

// ── Strips known sub-locale suffixes to get the parent "base name" ─────────────
function deriveParentNames(name) {
    const candidates = new Set();

    const patterns = [
        // "Green Breeze Ext." → "Green Breeze"
        /\s+Ext\.\s*(\(.*\))?\s*$/i,
        // "Green Breeze Extension" → "Green Breeze"
        /\s+Extension\s*(\(.*\))?\s*$/i,
        // "Green Breeze GWS" → "Green Breeze"
        /\s+GWS\s*(\(.*\))?\s*$/i,
        // "Green Breeze Group Worship Service" → "Green Breeze"
        /\s+Group\s+Worship\s+(Service|Services)\s*(\(.*\))?\s*$/i,
        // "Diaro Ext." → "Diaro"   /  handles trailing dot
        /\s+Ext\s*\.?\s*$/i,
    ];

    for (const pat of patterns) {
        const stripped = name.replace(pat, '').trim();
        if (stripped && stripped !== name) candidates.add(stripped);
    }

    // Also handle parenthetical form: "Aurora Ext. (Lokal ng Dingalan)" → "Aurora"
    const parenMatch = name.match(/^(.+?)\s+(?:Ext\.?|GWS|Extension|Group\s+Worship)\s*\(.+\)\s*$/i);
    if (parenMatch) candidates.add(parenMatch[1].trim());

    return [...candidates];
}

async function main() {
    await s.authenticate();
    console.log('Connected.\n');

    // 1. Get all inactive sub-locales (Ext. or GWS) with no slug
    const [subLocales] = await s.query(`
        SELECT id, name, district_id
        FROM local_congregation
        WHERE is_active = 0
          AND slug IS NULL
          AND (name LIKE '%Ext.%' OR name LIKE '%Extension%' OR name LIKE '%GWS%' OR name LIKE '%Group Worship%')
        ORDER BY name
    `);

    console.log(`Found ${subLocales.length} Ext./GWS sub-locales to process.\n`);

    let updated = 0;
    let unchanged = 0;
    let noParentFound = 0;
    const log = [];

    for (const sub of subLocales) {
        const parentNames = deriveParentNames(sub.name);
        if (parentNames.length === 0) {
            noParentFound++;
            continue;
        }

        // 2. Try to find active locale matching any parent name candidate
        let parent = null;
        for (const pName of parentNames) {
            const [rows] = await s.query(
                `SELECT id, name, district_id FROM local_congregation
                 WHERE is_active = 1 AND slug IS NOT NULL AND name = :name
                 LIMIT 1`,
                { replacements: { name: pName } }
            );
            if (rows.length > 0) {
                parent = rows[0];
                break;
            }
        }

        // Fuzzy fallback: LIKE match on the longest candidate
        if (!parent) {
            const longest = parentNames.sort((a, b) => b.length - a.length)[0];
            const [rows] = await s.query(
                `SELECT id, name, district_id FROM local_congregation
                 WHERE is_active = 1 AND slug IS NOT NULL AND name LIKE :name
                 ORDER BY LENGTH(name) ASC
                 LIMIT 1`,
                { replacements: { name: `${longest}%` } }
            );
            if (rows.length > 0) parent = rows[0];
        }

        if (!parent) {
            noParentFound++;
            log.push({ status: 'NO_PARENT', name: sub.name, tried: parentNames.join(' | ') });
            continue;
        }

        if (parent.district_id === sub.district_id) {
            unchanged++;
            continue;
        }

        // 3. Get both district names for logging
        const [[oldDist]] = await s.query(`SELECT name FROM districts WHERE id = :id`, { replacements: { id: sub.district_id } });
        const [[newDist]] = await s.query(`SELECT name FROM districts WHERE id = :id`, { replacements: { id: parent.district_id } });

        // 4. Update the district_id
        await s.query(
            `UPDATE local_congregation SET district_id = :newId WHERE id = :id`,
            { replacements: { newId: parent.district_id, id: sub.id } }
        );

        updated++;
        log.push({
            status: 'UPDATED',
            name: sub.name,
            parent: parent.name,
            from: oldDist?.name ?? `id:${sub.district_id}`,
            to: newDist?.name ?? `id:${parent.district_id}`,
        });
        console.log(`  ✅ ${sub.name}`);
        console.log(`     Parent: "${parent.name}" | ${oldDist?.name} → ${newDist?.name}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`  RESULTS`);
    console.log('='.repeat(60));
    console.log(`  Updated district_id  : ${updated}`);
    console.log(`  Already correct      : ${unchanged}`);
    console.log(`  No parent found      : ${noParentFound}`);
    console.log('='.repeat(60));

    if (noParentFound > 0) {
        console.log('\n⚠️  Sub-locales with no matchable parent (manual review needed):');
        log.filter(l => l.status === 'NO_PARENT')
            .forEach(l => console.log(`  - ${l.name}  (tried: ${l.tried})`));
    }

    await s.close();
}

main().catch(async e => { console.error(e.message); await s.close(); process.exit(1); });
