const express = require("express");
const puppeteer = require("puppeteer");

const IP_Address = process.env.REACT_IP_ADDRESS || "0.0.0.0"; // Default to listening on all interfaces

const app = express();
const PORT = 5001; // Run on port 5001

// CORS Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// 🟢 Scrape Worship Service Schedule (Getting the Last Instance)
app.get("/api/scrape/:congregation", async (req, res) => {
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

      // Remove unwanted elements (like Google Maps iframe, navigation buttons)
      lastContainer
        .querySelectorAll("iframe, .mdl-card__actions")
        .forEach((el) => el.remove());

      // Format the extracted HTML for better structure
      const formattedHTML = `
    <div class="schedule-container">
      ${lastContainer.innerHTML}
    </div>
  `;

      return formattedHTML;
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
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on ${IP_Address}:${PORT}`);
});
