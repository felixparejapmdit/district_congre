const express = require("express");
const router = express.Router();
const {
  scrapeCongregationSchedule,
} = require("../controllers/scraperController");

// 🟢 Route for Scraping Worship Service Schedule
router.get("/api/scrape/:congregation", scrapeCongregationSchedule);

module.exports = router;
