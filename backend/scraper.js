const express = require("express");
const puppeteer = require("puppeteer");
const axios = require("axios");
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

        const detailsData = await page.evaluate(() => {
            const result = {
                address: "",
                schedule: "",
                contact: "",
                mapUrl: "",
                navigateUrl: ""
            };

            const cards = document.querySelectorAll('.mdl-card__supporting-text');
            cards.forEach(card => {
                const title = card.querySelector('.mdl-card__title-text')?.innerText || "";

                // 1. Detect Schedule
                if (title.includes("Worship Service Schedule")) {
                    const clone = card.cloneNode(true);
                    // Remove buttons/actions if any
                    clone.querySelectorAll('.mdl-card__actions, iframe, .mdl-button').forEach(el => el.remove());
                    result.schedule = clone.innerHTML;
                }

                // 2. Detect Contact Info
                if (title.includes("Contact Information") || card.classList.contains('inc-contact-info')) {
                    const clone = card.cloneNode(true);
                    result.contact = clone.innerHTML;
                }

                // 3. Extract Address & Map Info (Location Card)
                const addressEl = card.querySelector('address');
                if (addressEl) {
                    result.address = addressEl.innerText.trim();

                    // Look for parent card to find Map and Navigate link
                    const cardParent = card.closest('.mdl-card');
                    if (cardParent) {
                        // Extract Iframe Src and fix restriction issue
                        const iframe = cardParent.querySelector('iframe');
                        if (iframe) {
                            const src = iframe.getAttribute('src');
                            const match = src.match(/q=([^&]+)/);
                            if (match && match[1]) {
                                // Convert to a generic embed URL that doesn't require a restricted API key
                                result.mapUrl = `https://maps.google.com/maps?q=${match[1]}&output=embed`;
                            } else {
                                result.mapUrl = src;
                            }
                        }

                        // Extract Navigate Link (Apple Maps usually has the coords)
                        const navLink = cardParent.querySelector('a[href*="maps.apple.com"]');
                        if (navLink) result.navigateUrl = navLink.getAttribute('href');
                    }
                }
            });

            return result;
        });

        // Check for success
        if (!detailsData.schedule && !detailsData.address) {
            return { success: false, schedule: "<p>No data found.</p>" };
        }

        return { ...detailsData, success: true };

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
                console.log(`⚠️ Attempt ${attempts}: Data not found.`);
                return res.json({ congregation, ...result });
            }

            console.log(`✅ Attempt ${attempts}: Scraping successful.`);
            return res.json({ congregation, ...result });

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

// 🟢 Proxy Disticts List
app.get("/api/districts", async (req, res) => {
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
});

// 🟢 Proxy Locales List (per district)
app.get("/api/locales", async (req, res) => {
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
});

app.listen(PORT, IP_Address, () => {
    console.log(`Scraper Server is running on11 ${IP_Address}:${PORT}`);
});