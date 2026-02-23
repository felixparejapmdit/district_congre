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

  const extractCoords = ($, html) => {
    // 1. Try Apple Maps link (most common)
    const navLink = $('a[href*="maps.apple.com"]').attr('href') || "";
    if (navLink) {
      const match = navLink.match(/q=([-.\d]+),\s*([-.\d]+)/) || navLink.match(/ll=([-.\d]+),\s*([-.\d]+)/);
      if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]), navLink };
    }

    // 2. Try searching raw HTML for JSON-LD or structured data
    const jsonMatch = html.match(/"latitude":\s*([-.\d]+),\s*"longitude":\s*([-.\d]+)/);
    if (jsonMatch) return { lat: parseFloat(jsonMatch[1]), lng: parseFloat(jsonMatch[2]), navLink: "" };

    return { lat: null, lng: null, navLink: "" };
  };

  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    });
    const $ = cheerio.load(data);
    const containers = $(".demo-card-square.mdl-card.mdl-shadow--2dp");

    if (!containers.length) {
      return res.json({
        success: false,
        congregation,
        schedule: "<p>No worship schedule found.</p>",
      });
    }

    const lastContainer = containers.last().html();
    const { lat: latitude, lng: longitude, navLink: navigateUrl } = extractCoords($, data);

    res.json({
      success: true,
      congregation,
      schedule: `<div class="schedule-container">${lastContainer}</div>`,
      address: $("address").first().text().trim(),
      contact: $(".inc-contact-info").html() || "",
      navigateUrl,
      latitude,
      longitude
    });
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn(`⚠️ Congregation not found: ${congregation}`);
      return res.json({
        success: false,
        congregation,
        schedule: "<p>Congregation page not found in directory.</p>"
      });
    }
    console.error("❌ Scraping failed:", error.message);
    res.status(500).json({ error: "Failed to scrape data." });
  }
};

/**
 * 🟢 Proxy Districts List
 */
const getDistricts = async (req, res) => {
  try {
    const url = "https://directory.iglesianicristo.net/districts";
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
 */
const getLocales = async (req, res) => {
  const { path } = req.query;
  if (!path) return res.status(400).json({ error: "Path is required" });

  try {
    const fullUrl = path.startsWith('http') ? path : `https://directory.iglesianicristo.net${path}`;
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
