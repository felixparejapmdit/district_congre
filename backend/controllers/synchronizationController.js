const axios = require("axios");
const cheerio = require("cheerio");
const { District, LocalCongregation, SyncHistory, SyncLog, AppConfig } = require("../models");
const { getRegionFromDistrict } = require("../utils/regionMapper");

const BASE_URL = "https://directory.iglesianicristo.net";
const SCRAPER_BASE = process.env.SCRAPER_HOST
    ? `${process.env.SCRAPER_HOST}/api`
    : "http://localhost:3001/api";

// Default reference point (updated dynamically from AppConfig)
let currentReferencePoint = { lat: 14.6508, lng: 121.0505, name: "Templo Central" };

// Global variable for progress tracking
let syncProgress = {
    status: "idle",
    percentage: 0,
    currentDistrict: "",
    currentLocale: "",
    processed: 0,
    total: 0
};

exports.getSyncProgress = (req, res) => {
    res.json(syncProgress);
};

// ─── Haversine Distance ────────────────────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

// ─── Scrape a single locale detail via the scraper service ────────────────────
async function scrapeLocale(slug) {
    try {
        const { data } = await axios.get(`${SCRAPER_BASE}/scrape/${slug}`, {
            timeout: 60000 // scraper can take up to 60s per locale
        });
        if (data && data.success !== false) return data;
    } catch (err) {
        console.warn(`  ⚠️  Scrape failed for [${slug}]: ${err.message}`);
    }
    return null;
}

// ─── Resolve IANA timezone from coordinates (free, no API key) ─────────────
async function resolveTimezone(lat, lng) {
    try {
        const { data } = await axios.get(
            `https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lng}`,
            { timeout: 8000 }
        );
        if (data?.timeZone) return data.timeZone;
    } catch { /* silent */ }
    return null;
}

// ─── Compute timezone offset label vs PH (UTC+8) ───────────────────────────
function tzDiffLabel(ianaZone) {
    if (!ianaZone) return null;
    try {
        const now = new Date();
        const toOffsetHr = (tz) => {
            const local = new Date(now.toLocaleString("en-US", { timeZone: tz }));
            const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
            return (local - utc) / 3600000;
        };
        const diff = toOffsetHr(ianaZone) - 8; // PH is UTC+8
        if (diff === 0) return "Same as PH (UTC+8)";
        return `${diff > 0 ? "+" : ""}${diff}h from PH (UTC+8)`;
    } catch { return null; }
}

// ─── Normalize Google image URL to =s800 ──────────────────────────────────
function normalizeImageUrl(url) {
    if (!url) return null;
    if (/lh[35]\.googleusercontent\.com/.test(url)) {
        return `${url.split("=")[0]}=s800`;
    }
    return url;
}

// ─── Log Change to DB ────────────────────────────────────────────────────────
async function logChange(syncId, localeId, localeName, field, oldVal, newVal) {
    if (String(oldVal) === String(newVal)) return;
    try {
        await SyncLog.create({
            sync_id: syncId,
            locale_id: localeId,
            locale_name: localeName,
            field_name: field,
            old_value: oldVal ? String(oldVal) : null,
            new_value: newVal ? String(newVal) : null
        });
    } catch (err) {
        console.error("❌ Failed to log change:", err.message);
    }
}

// ─── Fetch Reference Point ───────────────────────────────────────────────────
async function refreshReferencePoint() {
    try {
        const config = await AppConfig.findOne({ where: { key: "reference_point" } });
        if (config) {
            currentReferencePoint = config.value;
        } else {
            // Initialize with default if missing
            await AppConfig.create({ key: "reference_point", value: currentReferencePoint });
        }
    } catch (err) {
        console.error("❌ Failed to refresh reference point:", err.message);
    }
}


// ─── Core Sync Logic (called by both HTTP endpoint and cron scheduler) ────────
const runSync = async () => {
    if (syncProgress.status === "running") {
        console.log("⚠️  Sync already in progress — skipping.");
        return { skipped: true };
    }

    console.log("🚀 Starting Full Directory Sync with Enrichment...");
    await refreshReferencePoint();

    // Create Sync History record
    const history = await SyncHistory.create({ start_time: new Date() });

    syncProgress = {
        status: "running",
        percentage: 0,
        currentDistrict: "Fetching district list...",
        currentLocale: "",
        processed: 0,
        total: 0
    };

    // ── 0. Prep: Reset active status for all districts ───────────────────
    await District.update({ is_active: false }, { where: {} });

    // ── 1. Fetch Districts ────────────────────────────────────────────────
    const districtsResponse = await axios.get(`${BASE_URL}/districts`, {
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    const $ = cheerio.load(districtsResponse.data);
    const districtLinks = $(".mdl-list_item a.weight-700");

    let stats = {
        districtsProcessed: 0,
        localesProcessed: 0,
        districtsCreated: 0,
        localesCreated: 0,
        localesEnriched: 0,
        localesDeactivated: 0,
        localesReactivated: 0,
        updatesFound: 0
    };

    const districtsData = [];
    districtLinks.each((i, el) => {
        const href = $(el).attr("href");
        districtsData.push({
            name: $(el).text().trim(),
            path: href.startsWith("http")
                ? href
                : `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`
        });
    });

    const totalDistricts = districtsData.length;
    syncProgress.total = totalDistricts;
    await history.update({ total_districts: totalDistricts });
    console.log(`📂 Found ${totalDistricts} districts.`);

    // ── 2. Process each district ──────────────────────────────────────────
    for (let i = 0; i < districtsData.length; i++) {
        const d = districtsData[i];

        syncProgress.currentDistrict = d.name;
        syncProgress.processed = i + 1;
        syncProgress.percentage = Math.round(((i + 1) / totalDistricts) * 100);

        let [districtRecord, created] = await District.findOrCreate({
            where: { name: d.name },
            defaults: {
                name: d.name,
                is_active: true,
                region: getRegionFromDistrict(d.name)
            }
        });

        if (!created) {
            await districtRecord.update({
                is_active: true,
                region: getRegionFromDistrict(d.name)
            });
        }
        if (created) stats.districtsCreated++;
        stats.districtsProcessed++;

        // ── 3. Fetch locales for this district ────────────────────────────
        try {
            const localesResponse = await axios.get(d.path, {
                headers: { "User-Agent": "Mozilla/5.0" },
                timeout: 15000
            });
            const $loc = cheerio.load(localesResponse.data);
            const localeLinks = $loc('.mdl-grid a[href*="/locales/"]');

            const localesInDistrict = [];
            localeLinks.each((idx, el) => {
                const href = $loc(el).attr("href");
                localesInDistrict.push({
                    name: $loc(el).text().trim(),
                    slug: href.split("/").pop()
                });
            });

            // ── 4. For each locale: upsert + enrich ───────────────────────
            for (const l of localesInDistrict) {
                syncProgress.currentLocale = l.name;

                // Find or create the locale record
                let locale = await LocalCongregation.findOne({ where: { slug: l.slug } });
                let locCreated = false;

                if (locale) {
                    // Re-activate if it was previously deactivated
                    const wasInactive = locale.is_active === false;
                    await locale.update({ name: l.name, district_id: districtRecord.id, is_active: true });
                    if (wasInactive) stats.localesReactivated++;
                } else {
                    locale = await LocalCongregation.findOne({
                        where: { name: l.name, district_id: districtRecord.id }
                    });
                    if (locale) {
                        await locale.update({ slug: l.slug, is_active: true });
                    } else {
                        locale = await LocalCongregation.create({
                            name: l.name,
                            slug: l.slug,
                            district_id: districtRecord.id,
                            is_active: true
                        });
                        locCreated = true;
                        stats.localesCreated++;
                    }
                }
                stats.localesProcessed++;

                // ── 5. Enrich the locale with scraped + computed data ──────
                console.log(`  🔍 Enriching: ${l.name} (${l.slug})`);
                const scraped = await scrapeLocale(l.slug);

                if (scraped) {
                    const lat = scraped.latitude || locale.latitude;
                    const lng = scraped.longitude || locale.longitude;

                    // Detect changes for logging
                    const oldAddress = locale.address;
                    const oldSchedule = locale.schedule;

                    // Proximity calculations (Dynamic Reference Point)
                    const airKm = (lat && lng)
                        ? haversineKm(currentReferencePoint.lat, currentReferencePoint.lng, parseFloat(lat), parseFloat(lng))
                        : null;
                    const roadKm = airKm
                        ? (parseFloat(airKm) * 1.37).toFixed(1)
                        : null;
                    const travelMin = roadKm
                        ? Math.round((parseFloat(roadKm) / 28) * 60 + 10)
                        : null;
                    const travelLabel = travelMin
                        ? (travelMin >= 60
                            ? `${Math.floor(travelMin / 60)}h ${travelMin % 60}m`
                            : `${travelMin} min`)
                        : null;

                    // Timezone
                    const ianaZone = (lat && lng)
                        ? await resolveTimezone(parseFloat(lat), parseFloat(lng))
                        : null;
                    const tzDiff = tzDiffLabel(ianaZone);

                    // Image URL normalization
                    const imageUrl = normalizeImageUrl(
                        scraped.imageUrl || scraped.image_url || locale.image_url
                    );

                    const updatedFields = {
                        latitude: lat,
                        longitude: lng,
                        address: scraped.address || locale.address,
                        schedule: scraped.schedule || locale.schedule,
                        contact: scraped.contact || locale.contact,
                        image_url: imageUrl,
                        google_maps_link: scraped.mapUrl || scraped.navigateUrl || locale.google_maps_link,
                        air_distance: airKm ? `${airKm} km` : null,
                        road_distance: roadKm ? `${roadKm} km` : null,
                        travel_time: travelLabel,
                        timezone_diff: tzDiff ? `${ianaZone} · ${tzDiff}` : null,
                    };

                    await locale.update(updatedFields);

                    // Log changes if NOT a new record
                    if (!locCreated) {
                        if (scraped.address && scraped.address !== oldAddress) {
                            await logChange(history.id, locale.id, locale.name, "address", oldAddress, scraped.address);
                            stats.updatesFound++;
                        }
                        if (scraped.schedule && scraped.schedule !== oldSchedule) {
                            await logChange(history.id, locale.id, locale.name, "schedule", oldSchedule, scraped.schedule);
                            stats.updatesFound++;
                        }
                    }

                    stats.localesEnriched++;
                    console.log(`  ✅ Enriched: ${l.name} | Air: ${airKm} km | TZ: ${ianaZone || "n/a"}`);
                } else {
                    console.log(`  ⚠️  No scrape data for: ${l.name}`);
                }
            }

            // ── 6. Soft-deactivate locales no longer on the site ─────────────
            //    IDs are NEVER deleted. is_active=false hides them from counts/search.
            //    IMPORTANT: We explicitly guard slug IS NOT NULL because MySQL evaluates
            //    NULL NOT IN (...) as UNKNOWN, which causes NULL-slug sub-locales
            //    (Ext./GWS) to be incorrectly matched and deactivated.
            const liveslugs = localesInDistrict.map(l => l.slug).filter(Boolean);
            if (liveslugs.length > 0) {
                const { Op } = require('sequelize');
                const deactivated = await LocalCongregation.update(
                    { is_active: false },
                    {
                        where: {
                            district_id: districtRecord.id,
                            is_active: true,
                            slug: { [Op.not]: null, [Op.notIn]: liveslugs }
                        }
                    }
                );
                const deactivatedCount = Array.isArray(deactivated) ? deactivated[0] : 0;
                if (deactivatedCount > 0) {
                    console.log(`  🗑️  Deactivated ${deactivatedCount} stale locale(s) in ${d.name}`);
                    stats.localesDeactivated += deactivatedCount;
                }
            }

            console.log(`✅ [${syncProgress.percentage}%] Processed District: ${d.name}`);
        } catch (err) {
            console.error(`❌ Error processing district ${d.name}:`, err.message);
        }
    }

    syncProgress.status = "completed";
    syncProgress.percentage = 100;
    syncProgress.currentLocale = "";

    // ── 7. Auto-reparent Ext./GWS sub-locales to their parent's current district ──
    //    This fixes cases where a parent locale moved districts (e.g. district renamed)
    //    but its sub-locales still point to the old district.
    console.log("\n🔗 Reparenting Ext./GWS sub-locales to their parent's current district...");
    let reparented = 0;
    try {
        const sequelize = require('../config/database');
        // Get all inactive sub-locales with NULL slug
        const [subLocales] = await sequelize.query(`
            SELECT id, name, district_id FROM local_congregation
            WHERE is_active = 0 AND slug IS NULL
              AND (name LIKE '%Ext.%' OR name LIKE '%Extension%'
                   OR name LIKE '%GWS%' OR name LIKE '%Group Worship%')
        `);

        for (const sub of subLocales) {
            // Derive parent name candidates
            const baseName = sub.name
                .replace(/\s+Ext\.?\s*(\(.*\))?\s*$/i, '')
                .replace(/\s+Extension\s*(\(.*\))?\s*$/i, '')
                .replace(/\s+GWS\s*(\(.*\))?\s*$/i, '')
                .replace(/\s+Group\s+Worship\s+(Service|Services)\s*(\(.*\))?\s*$/i, '')
                .trim();

            if (!baseName || baseName === sub.name) continue;

            // Find the active parent locale
            const [parentRows] = await sequelize.query(
                `SELECT district_id FROM local_congregation
                 WHERE is_active = 1 AND slug IS NOT NULL AND name = :name LIMIT 1`,
                { replacements: { name: baseName } }
            );

            if (parentRows.length > 0 && parentRows[0].district_id !== sub.district_id) {
                await sequelize.query(
                    `UPDATE local_congregation SET district_id = :newId WHERE id = :id`,
                    { replacements: { newId: parentRows[0].district_id, id: sub.id } }
                );
                reparented++;
            }
        }
        console.log(`   ✅ Reparented ${reparented} sub-locale(s)`);
    } catch (err) {
        console.warn(`   ⚠️  Reparenting step failed (non-fatal): ${err.message}`);
    }

    // ── 8. Global cleanup: deactivate any active locale under an inactive district ──
    //    Catches locales that were missed by Step 6 because their district was
    //    already retired (not processed in the district loop at all).
    try {
        const sequelize = require('../config/database');
        const [globalCleanResult] = await sequelize.query(`
            UPDATE local_congregation lc
            INNER JOIN districts d ON lc.district_id = d.id
            SET lc.is_active = 0
            WHERE lc.is_active = 1 AND d.is_active = 0
        `);
        const globalCleaned = globalCleanResult?.affectedRows ?? 0;
        if (globalCleaned > 0) {
            console.log(`🧹 Global cleanup: deactivated ${globalCleaned} locale(s) under retired districts`);
            stats.localesDeactivated += globalCleaned;
        }
    } catch (err) {
        console.warn(`   ⚠️  Global cleanup step failed (non-fatal): ${err.message}`);
    }

    await history.update({
        end_time: new Date(),
        status: "completed",
        total_locales: stats.localesProcessed,
        new_locales: stats.localesCreated,
        updated_locales: stats.updatesFound
    });

    return { success: true, stats };
};  // ← closes runSync()

// ─── Export runSync so the scheduler can call it directly ────────────────────
exports.runSync = runSync;

// ─── Reset stuck sync (called from /api/sync/reset or on server startup) ──────
exports.resetSyncStatus = async (req, res) => {
    const wasRunning = syncProgress.status === "running";

    // Reset in-memory state
    syncProgress = {
        status: "idle",
        percentage: 0,
        currentDistrict: "",
        currentLocale: "",
        processed: 0,
        total: 0
    };

    // Mark any DB entries that are stuck as "failed"
    let dbFixed = 0;
    try {
        const [count] = await SyncHistory.update(
            { status: "failed", end_time: new Date(), error_message: "Manually reset — process was interrupted" },
            { where: { status: "running" } }
        );
        dbFixed = count;
    } catch (err) {
        console.warn("Could not update stuck SyncHistory:", err.message);
    }

    console.log(`🔄 Sync status reset. Was running: ${wasRunning}. DB stuck entries fixed: ${dbFixed}`);
    if (res) {
        res.status(200).json({
            message: "Sync status has been reset. You can now start a new sync.",
            wasRunning,
            dbEntriesFixed: dbFixed
        });
    }
};

// ─── Called on server startup to recover from a crashed/interrupted sync ───────
exports.recoverStuckSync = async () => {
    try {
        const stuck = await SyncHistory.findAll({ where: { status: "running" } });
        if (stuck.length > 0) {
            await SyncHistory.update(
                { status: "failed", end_time: new Date(), error_message: "Server restarted — sync was interrupted" },
                { where: { status: "running" } }
            );
            console.log(`🔄 Startup recovery: marked ${stuck.length} interrupted sync(s) as failed.`);
        }
    } catch (err) {
        console.warn("Startup sync recovery failed (non-fatal):", err.message);
    }
};

// ─── HTTP Handler: POST /api/sync/directory ───────────────────────────────────
exports.syncDirectoryData = async (req, res) => {
    try {
        const result = await runSync();
        if (result.skipped) {
            return res.status(409).json({ message: "Sync already in progress." });
        }
        res.status(200).json({
            message: "Synchronization with enrichment completed successfully.",
            stats: result.stats
        });
    } catch (error) {
        syncProgress.status = "failed";
        console.error("❌ Synchronization failed:", error);

        // Find the last running history and mark as failed
        const lastHistory = await SyncHistory.findOne({
            where: { status: "running" },
            order: [["id", "DESC"]]
        });
        if (lastHistory) {
            await lastHistory.update({
                status: "failed",
                end_time: new Date(),
                error_message: error.message
            });
        }

        res.status(500).json({
            message: "Internal server error during synchronization.",
            error: error.message
        });
    }
};

