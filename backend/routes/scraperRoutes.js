const express = require("express");
const router = express.Router();
const {
  scrapeCongregationSchedule,
  getDistricts,
  getLocales
} = require("../controllers/scraperController");

// 🟢 Route for Scraping Worship Service Schedule
router.get("/api/scrape/:congregation", scrapeCongregationSchedule);

// 🟢 Proxy routes for Directory Manager (Scoped to /scraper to avoid API conflicts)
router.get("/api/scraper/districts", getDistricts);
router.get("/api/scraper/locales", getLocales);

module.exports = router;
