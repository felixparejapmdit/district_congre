const express = require("express");
const puppeteer = require("puppeteer");
const util = require('util');
const sleep = util.promisify(setTimeout); 

const IP_Address = process.env.REACT_IP_ADDRESS || "0.0.0.0"; 
const app = express();
const PORT = 5001; 

// CORS Middleware (Unchanged)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

// 🟢 Core scraping logic: handles browser/page setup and data extraction
const runScraper = async (congregation, url) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();

        // Use a 30s timeout for page load
        await page.goto(url, { waitUntil: "load", timeout: 30000 }); 

        // Wait for the key element to appear
        await page.waitForSelector(".demo-card-square.mdl-card.mdl-shadow--2dp", {
            timeout: 30000,
        });

        const scheduleData = await page.evaluate(() => {
            const containers = document.querySelectorAll(
                ".demo-card-square.mdl-card.mdl-shadow--2dp"
            );
            if (!containers.length) {
                return "<p>No worship schedule found.</p>";
            }

            const lastContainer = containers[containers.length - 1];

            lastContainer
                .querySelectorAll("iframe, .mdl-card__actions")
                .forEach((el) => el.remove());

            const formattedHTML = `<div class="schedule-container">${lastContainer.innerHTML}</div>`;

            return formattedHTML;
        });

        // Check for specific text to confirm successful scrape
        if (!scheduleData.includes("Worship Service Schedule")) {
            return { success: false, schedule: "<p>No worship schedule found.</p>" };
        }

        return { success: true, schedule: scheduleData };

    } catch (error) {
        // Throw to the external retry loop for handling
        throw error; 
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

// 🟢 Endpoint with Retry Logic
app.get("/api/scrape/:congregation", async (req, res) => {
    const congregation = req.params.congregation.replace(/\s+/g, "-");
    const url = `https://directory.iglesianicristo.net/locales/${congregation}`;

    const MAX_RETRIES = 3;
    let attempts = 0;

    console.log(`🔍 Scraping data from: ${url}`);

    while (attempts < MAX_RETRIES) {
        attempts++;
        try {
            const result = await runScraper(congregation, url);

            if (!result.success) {
                 console.log(`⚠️ Attempt ${attempts}: Schedule not found.`);
                 return res.json({ congregation, schedule: result.schedule });
            }

            console.log(`✅ Attempt ${attempts}: Scraping successful.`);
            return res.json({ congregation, schedule: result.schedule });
            
        } catch (error) {
            if (attempts < MAX_RETRIES) {
                console.error(`❌ Attempt ${attempts} failed. Retrying in 2s...`);
                await sleep(2000); // Wait 2 seconds before retrying
            } else {
                console.error(`❌ Scraping failed after ${MAX_RETRIES} attempts.`, error);
                // Final failure: return a generic 500 error status
                return res.status(500).json({ error: "Failed to scrape data after multiple retries." });
            }
        }
    }
});

app.listen(PORT, IP_Address, () => {
    console.log(`Scraper Server is running on11 ${IP_Address}:${PORT}`);
});