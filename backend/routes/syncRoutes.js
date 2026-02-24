const express = require("express");
const router = express.Router();
const synchronizationController = require("../controllers/synchronizationController");
const scheduler = require("../scheduler");

// ── Directory Sync ────────────────────────────────────────────────────────────
router.post("/api/sync/directory", synchronizationController.syncDirectoryData);
router.get("/api/sync/progress", synchronizationController.getSyncProgress);
router.post("/api/sync/reset", synchronizationController.resetSyncStatus);

// ── Scheduler Controls ────────────────────────────────────────────────────────
// GET  /api/scheduler/status  — returns state, next run, last run, enabled flag
router.get("/api/scheduler/status", (req, res) => {
    res.json(scheduler.getStatus());
});

// POST /api/scheduler/enable  — body: { cronExpression?: "0 0 * * *" }
router.post("/api/scheduler/enable", (req, res) => {
    const { cronExpression } = req.body || {};
    const status = scheduler.enable(cronExpression);
    res.json({ message: "Scheduler enabled.", status });
});

// POST /api/scheduler/disable
router.post("/api/scheduler/disable", (req, res) => {
    const status = scheduler.disable();
    res.json({ message: "Scheduler disabled.", status });
});

// POST /api/scheduler/run-now — manually trigger the sync (same as Generate Data)
router.post("/api/scheduler/run-now", async (req, res) => {
    try {
        const result = await synchronizationController.runSync
            ? (() => { res.json({ message: "Starting sync..." }); return synchronizationController.runSync(); })()
            : null;
        if (!result) {
            return res.status(500).json({ message: "runSync not available." });
        }
    } catch (err) {
        console.error("Manual trigger failed:", err.message);
    }
});

module.exports = router;
