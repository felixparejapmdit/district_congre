const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");

router.get("/api/audit/logs", auditController.getGlobalLogs);
router.get("/api/audit/history", auditController.getSyncHistory);
router.get("/api/config/reference-point", auditController.getReferencePoint);
router.post("/api/config/reference-point", auditController.updateReferencePoint);

module.exports = router;
