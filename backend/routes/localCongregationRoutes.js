const express = require("express");
const router = express.Router();
const localCongregationController = require("../controllers/localCongregationController");


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


// 🟢 NEW: Route to fetch congregations for MULTIPLE district IDs
router.get(
  "/api/local-congregations-multi",
  localCongregationController.getLocalCongregationsByMultiDistrict
);

// 🟢 NEW: Route to fetch ALL congregations for global search
router.get(
  "/api/all-congregations",
  localCongregationController.getAllCongregations
);


// Import Local Congregations
router.post(
  "/api/import-local-congregations",
  localCongregationController.importLocalCongregations
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
