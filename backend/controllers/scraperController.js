const puppeteer = require("puppeteer");

// 🟢 Scrape Worship Service Schedule
const scrapeCongregationSchedule = async (req, res) => {
  const congregation = req.params.congregation
    .replace(/\s+/g, "-") // Replace spaces with "-"
    .replace(/[.,]/g, ""); // Remove both dots (.) and commas (,)

  const url = `https://directory.iglesianicristo.net/locales/${congregation}`;

  console.log(`🔍 Scraping data from: ${url}`);

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
      ], // Optimized for speed and server environments
    });

    const page = await browser.newPage();

    // 🚀 Block unnecessary resources like images, styles, and fonts
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (
        ["image", "stylesheet", "font", "media"].includes(req.resourceType())
      ) {
        req.abort(); // Block unnecessary requests
      } else {
        req.continue();
      }
    });

    // ✅ Faster page loading using `networkidle0` (instead of `load`)
    await page.goto(url, { waitUntil: "networkidle0", timeout: 100000 });

    // Ensure the target element is present
    await page.waitForSelector(".demo-card-square.mdl-card.mdl-shadow--2dp", {
      timeout: 30000, // Reduce timeout for quicker failures
    });

    const scheduleData = await page.evaluate(() => {
      const containers = document.querySelectorAll(
        ".demo-card-square.mdl-card.mdl-shadow--2dp"
      );
      if (!containers.length) return "<p>No worship schedule found.</p>";

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
