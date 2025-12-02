const express = require("express");
const router = express.Router();
const localCongregationController = require("../controllers/localCongregationController");

// Import Local Congregations
router.post(
  "/api/import-local-congregations",
  localCongregationController.importLocalCongregations
);

// Get all OR filter by district_id
router.get(
  "/api/local-congregations",
  localCongregationController.getLocalCongregationsByDistrict
);

// Get a single local congregation by ID
router.get(
  "/api/local-congregations/:id",
  localCongregationController.getLocalCongregationById
);

// Create a new local congregation
router.post(
  "/api/local-congregations",
  localCongregationController.createLocalCongregation
);

// Update a local congregation
router.put(
  "/api/local-congregations/:id",
  localCongregationController.updateLocalCongregation
);

// Delete a local congregation
router.delete(
  "/api/local-congregations/:id",
  localCongregationController.deleteLocalCongregation
);

module.exports = router;
