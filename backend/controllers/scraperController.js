const puppeteer = require("puppeteer");

// 🟢 Scrape Worship Service Schedule
const scrapeCongregationSchedule = async (req, res) => {
  const congregation = req.params.congregation.replace(/\s+/g, "-"); // Format congregation name
  const url = `https://directory.iglesianicristo.net/locales/${congregation}`;

  console.log(`🔍 Scraping data from: ${url}`);

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // Ensures Puppeteer works in all environments
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "load", timeout: 60000 });

    // Ensure element exists before scraping
    await page.waitForSelector(".demo-card-square.mdl-card.mdl-shadow--2dp", {
      timeout: 60000,
    });

    const scheduleData = await page.evaluate(() => {
      const containers = document.querySelectorAll(
        ".demo-card-square.mdl-card.mdl-shadow--2dp"
      );
      if (!containers.length) {
        return "<p>No worship schedule found.</p>";
      }

      // Get the last instance of the element (latest schedule)
      const lastContainer = containers[containers.length - 1];

      // Remove unwanted elements (Google Maps iframe, navigation buttons)
      lastContainer
        .querySelectorAll("iframe, .mdl-card__actions")
        .forEach((el) => el.remove());

      return lastContainer.outerHTML;
    });

    await browser.close();

    if (!scheduleData.includes("Worship Service Schedule")) {
      console.log("⚠️ Schedule not found.");
      return res.json({
        congregation,
        schedule: "<p>No worship schedule found.</p>",
      });
    }

    res.json({ congregation, schedule: scheduleData });
  } catch (error) {
    console.error("❌ Scraping failed:", error);
    res.status(500).json({ error: "Failed to scrape data." });
  }
};

module.exports = { scrapeCongregationSchedule };
