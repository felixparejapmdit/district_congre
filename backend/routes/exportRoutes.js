// backend/routes/exportRoutes.js
const express = require('express');
const exportController = require('../controllers/exportController');
const router = express.Router();

// 🟢 Route: accessible at /api/export-schedule when used in server.js
router.post('/export-schedule', exportController.exportSchedule);
router.post('/generate-excel-json', exportController.generateExcelFromJson);

module.exports = router;