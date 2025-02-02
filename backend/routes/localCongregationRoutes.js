const express = require("express");
const router = express.Router();
const localCongregationController = require("../controllers/localCongregationController");


// Import Local Congregations
router.post("/api/import-local-congregations", localCongregationController.importLocalCongregations);


// Get all local congregations
router.get("/api/local-congregations/", localCongregationController.getAllLocalCongregations);

// Get a single local congregation by ID
router.get("/api/local-congregations/:id", localCongregationController.getLocalCongregationById);

// Create a new local congregation
router.post("/api/local-congregations/", localCongregationController.createLocalCongregation);

// Update a local congregation by ID
router.put("/api/local-congregations/:id", localCongregationController.updateLocalCongregation);

// Delete a local congregation by ID
router.delete("/api/local-congregations/:id", localCongregationController.deleteLocalCongregation);

module.exports = router;
