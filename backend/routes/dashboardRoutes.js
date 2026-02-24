const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

router.get("/api/dashboard/stats", dashboardController.getStats);
router.get("/api/dashboard/sub-locales", dashboardController.getSubLocales);

module.exports = router;
