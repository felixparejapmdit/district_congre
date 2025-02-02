const express = require("express");
const router = express.Router();

const districtsController = require("../controllers/districtController");

// Import Districts
router.post("/api/import-districts", districtsController.importDistricts);

// Get all districts
router.get("/api/districts/", districtsController.getAllDistricts);

// Get a single district by ID
router.get("/api/districts/:id", districtsController.getDistrictById);

// Create a new district
router.post("/api/districts/", districtsController.createDistrict);

// Update a district by ID
router.put("/api/districts/:id", districtsController.updateDistrict);

// Delete a district by ID
router.delete("/api/districts/:id", districtsController.deleteDistrict);

module.exports = router;
