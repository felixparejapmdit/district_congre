const axios = require("axios");
const cheerio = require("cheerio");

/**
 * 🟢 Scrape Worship Service Schedule
 * Uses Axios + Cheerio for fast data extraction from the directory
 */
const scrapeCongregationSchedule = async (req, res) => {
  const congregation = req.params.congregation
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[.,]/g, "")
    .replace(/\s+/g, "-");

  const url = `https://directory.iglesianicristo.net/locales/${congregation}`;
  console.log(`🔍 Scraping schedule from: ${url}`);

  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    });
    const $ = cheerio.load(data);
    const containers = $(".demo-card-square.mdl-card.mdl-shadow--2dp");

    if (!containers.length) {
      return res.json({
        congregation,
        schedule: "<p>No worship schedule found.</p>",
      });
    }

    const lastContainer = containers.last().html();
    res.json({
      congregation,
      schedule: `<div class="schedule-container">${lastContainer}</div>`,
      address: $("address").first().text().trim(),
      contact: $(".inc-contact-info").html() || "",
      navigateUrl: $('a[href*="maps.apple.com"]').attr('href') || ""
    });
  } catch (error) {
    console.error("❌ Scraping failed:", error.message);
    res.status(500).json({ error: "Failed to scrape data." });
  }
};

/**
 * 🟢 Proxy Districts List
 * Fetches the raw HTML of the districts list from the directory
 */
const getDistricts = async (req, res) => {
  try {
    const url = "https://directory.iglesianicristo.net/districts";
    console.log(`🔍 Proxying districts from: ${url}`);
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    });
    res.send(response.data);
  } catch (error) {
    console.error("❌ Failed to proxy districts:", error.message);
    res.status(500).json({ error: "Failed to fetch districts from source." });
  }
};

/**
 * 🟢 Proxy Locales List
 * Fetches the raw HTML of locales for a specific district path
 */
const getLocales = async (req, res) => {
  const { path } = req.query;
  if (!path) return res.status(400).json({ error: "Path is required" });

  try {
    const fullUrl = path.startsWith('http') ? path : `https://directory.iglesianicristo.net${path}`;
    console.log(`🔍 Proxying locales from: ${fullUrl}`);
    const response = await axios.get(fullUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    });
    res.send(response.data);
  } catch (error) {
    console.error(`❌ Failed to proxy locales for ${path}:`, error.message);
    res.status(500).json({ error: "Failed to fetch locales from source." });
  }
};

module.exports = {
  scrapeCongregationSchedule,
  getDistricts,
  getLocales
};
