const express = require("express");
const router = express.Router();
const synchronizationController = require("../controllers/synchronizationController");

router.post("/api/sync/directory", synchronizationController.syncDirectoryData);
router.get("/api/sync/progress", synchronizationController.getSyncProgress);

module.exports = router;
