const axios = require("axios");
const cheerio = require("cheerio");

// 🟢 Scrape Worship Service Schedule (Using Axios + Cheerio)
const scrapeCongregationSchedule = async (req, res) => {
  // Sanitize and format the congregation name for the URL
  const congregation = req.params.congregation
    .toLowerCase()
    .replace(/'/g, "") // Remove single quotes/apostrophes
    .replace(/[.,]/g, "") // Remove dots and commas
    .replace(/\s+/g, "-"); // Replace spaces with dashes

  const url = `https://directory.iglesianicristo.net/locales/${congregation}`;

  console.log(`🔍 Scraping data from: ${url}`);

  try {
    // ✅ Use Axios for a fast HTTP request (No Browser Overhead)
    const { data } = await axios.get(url, { timeout: 15000 });

    // ✅ Load HTML response into Cheerio
    const $ = cheerio.load(data);

    // ✅ Select all schedule containers
    const containers = $(".demo-card-square.mdl-card.mdl-shadow--2dp");

    if (!containers.length) {
      return res.json({
        congregation,
        schedule: "<p>No worship schedule found.</p>",
      });
    }

    // ✅ Get the last schedule container (latest schedule)
    const lastContainer = containers.last().html();

    console.log(lastContainer);
    res.json({
      congregation,
      schedule: `<div class="schedule-container">${lastContainer}</div>`,
    });
  } catch (error) {
    console.error("❌ Scraping failed:", error);
    res.status(500).json({ error: "Failed to scrape data." });
  }
};

module.exports = { scrapeCongregationSchedule };
