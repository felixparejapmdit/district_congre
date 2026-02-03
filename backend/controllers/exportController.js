// backend/controllers/exportController.js

const ExcelJS = require('exceljs');
const axios = require('axios');
const cheerio = require('cheerio');
const { Op } = require('sequelize');
const util = require('util');
const sleep = util.promisify(setTimeout);

// Import models
const District = require("../models/District");
const LocalCongregation = require("../models/LocalCongregation");

// ------------------------------
// 🟢 Fetch congregations by district IDs
// ------------------------------
const getCongregationsByDistrictIds = async (districtIds) => {
    if (!districtIds || districtIds.length === 0) return [];

    try {
        const congregations = await LocalCongregation.findAll({
            where: { district_id: { [Op.in]: districtIds } },
            include: [{ model: District, attributes: ['name'] }],
            order: [[District, 'name', 'ASC'], ['name', 'ASC']],
            attributes: ['id', 'name', 'district_id'],
            raw: true,
        });

        return congregations.map(c => ({
            id: c.id,
            district_id: c.district_id,
            district_name: c['District.name'],
            name: c.name,
        }));

    } catch (err) {
        console.error("Database fetch failed:", err);
        throw new Error("Failed to retrieve congregations.");
    }
};

// ------------------------------
// 🟢 Format local congregation name for URL
// ------------------------------
const formatLocalForUrl = (name) => {
    return encodeURIComponent(
        name.replace(/\s+/g, "-")
            .replace(/[.,'/()]/g, "")
            .replace(/ñ/g, "n")
            .replace(/Ñ/g, "N")
    );
};

// ------------------------------
// 🟢 Fetch schedule using Axios + Cheerio
// ------------------------------
const fetchSchedule = async (congName) => {
    const url = `https://directory.iglesianicristo.net/locales/${formatLocalForUrl(congName)}`;
    try {
        console.log(`🔍 Fetching schedule for: ${congName} → ${url}`);
        const { data } = await axios.get(url, { timeout: 30000 });
        const $ = cheerio.load(data);

        const containers = $(".demo-card-square.mdl-card.mdl-shadow--2dp");
        if (!containers.length) {
            console.warn(`⚠️ No schedule container found for ${congName}`);
            return {};
        }

        const lastContainerHtml = containers.last().html();
        const $container = cheerio.load(lastContainerHtml);

        const scheduleData = {};

        $container(".daygroup").each((_, daygroup) => {
            const day = $container(daygroup).find('h6').first().text().trim().toUpperCase();
            const times = [];

            $container(daygroup).find('.chip').each((_, chip) => {
                const timeText = $container(chip).contents().first().text().trim();
                const lang = $container(chip).find('.subchip').text().trim();
                if (timeText) times.push(`${timeText} (${lang})`);
            });

            if (times.length) {
                scheduleData[day] = times.join(' | ');
                console.log(`📅 ${congName} → ${day}: ${scheduleData[day]}`);
            }
        });

        return scheduleData;

    } catch (err) {
        console.warn(`❌ Scrape failed for ${congName}: ${err.message}`);
        return { WEDNESDAY: "Scrape Failed" };
    }
};

// ------------------------------
// 🟢 Export Controller
// ------------------------------
exports.exportSchedule = async (req, res) => {
    const { districtIds } = req.body;
    if (!districtIds || districtIds.length === 0) {
        return res.status(400).send({ message: "No districts selected for export." });
    }

    const DELAY_MS = 500;

    try {
        const congregations = await getCongregationsByDistrictIds(districtIds);
        if (!congregations.length) return res.status(404).send({ message: "No local congregations found." });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Worship Schedules');

        worksheet.columns = [
            { header: 'District', key: 'district', width: 25 },
            { header: 'Local Congregation', key: 'congregation', width: 35 },
            { header: 'Wednesday', key: 'wednesday', width: 40 },
            { header: 'Thursday', key: 'thursday', width: 40 },
            { header: 'Saturday', key: 'saturday', width: 40 },
            { header: 'Sunday', key: 'sunday', width: 40 },
        ];
        worksheet.getRow(1).font = { bold: true, size: 12 };

        for (const cong of congregations) {
            console.log(`\n⏳ Starting fetch for: ${cong.name}`);
            const scheduleData = await fetchSchedule(cong.name);

            worksheet.addRow({
                district: cong.district_name || 'N/A',
                congregation: cong.name,
                wednesday: scheduleData['WEDNESDAY'] || '',
                thursday: scheduleData['THURSDAY'] || '',
                saturday: scheduleData['SATURDAY'] || '',
                sunday: scheduleData['SUNDAY'] || '',
            });

            console.log(`✅ Finished ${cong.name}`);
            await sleep(DELAY_MS);
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=worship_schedules_export.xlsx');
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error("Export failed:", err);
        res.status(500).send({ message: "Failed to generate export file.", error: err.message });
    }
};

// ------------------------------
// 🟢 Generate Excel from JSON Data (New for Frontend-led progress)
// ------------------------------
exports.generateExcelFromJson = async (req, res) => {
    const { data } = req.body;
    if (!data || !Array.isArray(data)) {
        return res.status(400).send({ message: "Invalid data format." });
    }

    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Worship Schedules');

        worksheet.columns = [
            { header: 'District', key: 'district', width: 25 },
            { header: 'Local Congregation', key: 'congregation', width: 35 },
            { header: 'Wednesday', key: 'wednesday', width: 40 },
            { header: 'Thursday', key: 'thursday', width: 40 },
            { header: 'Saturday', key: 'saturday', width: 40 },
            { header: 'Sunday', key: 'sunday', width: 40 },
        ];
        worksheet.getRow(1).font = { bold: true, size: 12 };

        data.forEach(item => {
            worksheet.addRow({
                district: item.district || 'N/A',
                congregation: item.congregation,
                wednesday: item.wednesday || '',
                thursday: item.thursday || '',
                saturday: item.saturday || '',
                sunday: item.sunday || '',
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=worship_schedules_export.xlsx');
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error("Manual Export failed:", err);
        res.status(500).send({ message: "Failed to generate export file." });
    }
};

