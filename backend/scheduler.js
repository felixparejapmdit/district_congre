/**
 * scheduler.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Node-cron based background scheduler for the Directory Sync.
 *
 * Default schedule: every day at 12:00 AM Philippine Time (UTC+8)
 * Cron expression:  0 0 * * *  (at 00:00 every day)
 *
 * The scheduler state is preserved in memory while the server is running.
 * Settings are also persisted to scheduler-config.json so Docker restarts
 * preserve the user's enabled/disabled preference.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const cron = require("node-cron");
const path = require("path");
const fs = require("fs");
const { runSync } = require("./controllers/synchronizationController");

// ── Config persistence ────────────────────────────────────────────────────────
const CONFIG_PATH = path.join(__dirname, "scheduler-config.json");

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
        }
    } catch { /* first run */ }
    return { enabled: true, cronExpression: "0 0 * * *" };
}

function saveConfig(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
    } catch (err) {
        console.error("⚠️  Could not save scheduler config:", err.message);
    }
}

// ── Scheduler State ───────────────────────────────────────────────────────────
let config = loadConfig();
let cronTask = null;
let lastRun = null;
let lastRunStatus = null; // "success" | "failed" | "skipped"

function getStatus() {
    return {
        enabled: config.enabled,
        cronExpression: config.cronExpression,
        // Human-readable: "Every day at 12:00 AM (PH Time)"
        description: cronToHuman(config.cronExpression),
        lastRun,
        lastRunStatus,
        nextRun: cronTask ? getNextRun(config.cronExpression) : null,
        timezone: "Asia/Manila"
    };
}

function cronToHuman(expr) {
    if (expr === "0 0 * * *") return "Every day at 12:00 AM (Philippine Time)";
    if (expr === "0 2 * * *") return "Every day at 2:00 AM (Philippine Time)";
    if (expr === "0 3 * * *") return "Every day at 3:00 AM (Philippine Time)";
    if (expr === "0 */12 * * *") return "Every 12 hours";
    if (expr === "0 */6 * * *") return "Every 6 hours";
    return expr;
}

function getNextRun(expr) {
    try {
        // Calculate next run time using node-cron's interval object
        const now = new Date();
        // Approximate next run by parsing the cron expression manually
        // (node-cron doesn't expose a nextDate() API, so we do a simple check)
        const phNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
        const nextMidnight = new Date(phNow);
        nextMidnight.setDate(nextMidnight.getDate() + 1);
        nextMidnight.setHours(0, 0, 0, 0);
        return nextMidnight.toISOString();
    } catch { return null; }
}

// ── Start the cron task ───────────────────────────────────────────────────────
function startScheduler() {
    if (cronTask) {
        cronTask.destroy();
        cronTask = null;
    }

    if (!config.enabled) {
        console.log("📅 Scheduler is DISABLED. Skipping cron registration.");
        return;
    }

    if (!cron.validate(config.cronExpression)) {
        console.error(`❌ Invalid cron expression: "${config.cronExpression}"`);
        return;
    }

    cronTask = cron.schedule(
        config.cronExpression,
        async () => {
            const now = new Date().toISOString();
            console.log(`\n📅 [SCHEDULER] Triggered at ${now} — Starting Directory Sync...\n`);
            lastRun = now;
            try {
                const result = await runSync();
                lastRunStatus = result.skipped ? "skipped" : "success";
                console.log(`\n📅 [SCHEDULER] Sync complete — Status: ${lastRunStatus}\n`);
            } catch (err) {
                lastRunStatus = "failed";
                console.error(`\n📅 [SCHEDULER] Sync FAILED:`, err.message, `\n`);
            }
        },
        {
            scheduled: true,
            timezone: "Asia/Manila"   // All times in Philippine Time
        }
    );

    console.log(`📅 Scheduler ACTIVE — "${config.cronExpression}" (Asia/Manila) — ${cronToHuman(config.cronExpression)}`);
}

// ── Public API (used by scheduler routes) ────────────────────────────────────
function enable(cronExpression) {
    config.enabled = true;
    if (cronExpression && cron.validate(cronExpression)) {
        config.cronExpression = cronExpression;
    }
    saveConfig(config);
    startScheduler();
    return getStatus();
}

function disable() {
    config.enabled = false;
    saveConfig(config);
    if (cronTask) {
        cronTask.destroy();
        cronTask = null;
    }
    console.log("📅 Scheduler DISABLED.");
    return getStatus();
}

module.exports = { startScheduler, enable, disable, getStatus };
