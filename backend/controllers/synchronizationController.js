const axios = require("axios");
const cheerio = require("cheerio");
const District = require("../models/District");
const LocalCongregation = require("../models/LocalCongregation");

const BASE_URL = "https://directory.iglesianicristo.net";

// Global variable for progress tracking
let syncProgress = {
    status: "idle",
    percentage: 0,
    currentDistrict: "",
    processed: 0,
    total: 0
};

exports.getSyncProgress = (req, res) => {
    res.json(syncProgress);
};

exports.syncDirectoryData = async (req, res) => {
    try {
        console.log("🚀 Starting Directory Sync...");
        syncProgress = { status: "running", percentage: 0, currentDistrict: "Fetching district list...", processed: 0, total: 0 };

        // 1. Fetch Districts
        const districtsResponse = await axios.get(`${BASE_URL}/districts`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(districtsResponse.data);
        const districtLinks = $('.mdl-list_item a.weight-700');

        let stats = {
            districtsProcessed: 0,
            localesProcessed: 0,
            districtsCreated: 0,
            localesCreated: 0
        };

        const districtsData = [];
        districtLinks.each((i, el) => {
            const href = $(el).attr('href');
            districtsData.push({
                name: $(el).text().trim(),
                path: href.startsWith('http') ? href : `${BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`
            });
        });

        const totalDistricts = districtsData.length;
        syncProgress.total = totalDistricts;
        console.log(`📂 Found ${totalDistricts} districts.`);

        // 2. Process each district and its locales
        for (let i = 0; i < districtsData.length; i++) {
            const d = districtsData[i];

            // Update Progress
            syncProgress.currentDistrict = d.name;
            syncProgress.processed = i + 1;
            syncProgress.percentage = Math.round(((i + 1) / totalDistricts) * 100);

            // Find or update district
            let [district, created] = await District.findOrCreate({
                where: { name: d.name },
                defaults: { name: d.name }
            });

            if (created) stats.districtsCreated++;
            stats.districtsProcessed++;

            // Fetch Locales for this district
            try {
                const localesResponse = await axios.get(d.path, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    timeout: 15000
                });
                const $loc = cheerio.load(localesResponse.data);
                const localeLinks = $loc('.mdl-grid a[href*="/locales/"]');

                const localesInDistrict = [];
                localeLinks.each((index, el) => {
                    const href = $(el).attr('href');
                    localesInDistrict.push({
                        name: $(el).text().trim(),
                        slug: href.split('/').pop()
                    });
                });

                for (const l of localesInDistrict) {
                    let locale = await LocalCongregation.findOne({ where: { slug: l.slug } });

                    if (locale) {
                        await locale.update({
                            name: l.name,
                            district_id: district.id
                        });
                    } else {
                        locale = await LocalCongregation.findOne({
                            where: { name: l.name, district_id: district.id }
                        });

                        if (locale) {
                            await locale.update({ slug: l.slug });
                        } else {
                            await LocalCongregation.create({
                                name: l.name,
                                slug: l.slug,
                                district_id: district.id
                            });
                            stats.localesCreated++;
                        }
                    }
                    stats.localesProcessed++;
                }

                console.log(`✅ [${syncProgress.percentage}%] Processed District: ${d.name}`);
            } catch (err) {
                console.error(`❌ Error fetching locales for district ${d.name}:`, err.message);
            }
        }

        syncProgress.status = "completed";
        syncProgress.percentage = 100;

        res.status(200).json({
            message: "Synchronization completed successfully.",
            stats
        });

    } catch (error) {
        syncProgress.status = "failed";
        console.error("❌ Synchronization failed:", error);
        res.status(500).json({ message: "Internal server error during synchronization.", error: error.message });
    }
};
