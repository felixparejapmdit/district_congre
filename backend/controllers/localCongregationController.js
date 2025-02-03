const LocalCongregation = require("../models/LocalCongregation");
const District = require("../models/District"); // Ensure District model exists

// Function to insert data in batches
const insertDataInBatches = async (data, batchSize = 500) => {
  return new Promise(async (resolve, reject) => {
    let index = 0;
    while (index < data.length) {
      const batch = data.slice(index, index + batchSize);
      try {
        await LocalCongregation.bulkCreate(batch);
        console.log(`Inserted ${batch.length} rows`);
      } catch (error) {
        console.error("Error inserting batch:", error);
        return reject(error);
      }
      index += batchSize;
    }
    resolve("All data inserted successfully!");
  });
};

// Import local congregations in batches
exports.importLocalCongregations = async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || data.length === 0) {
      return res.status(400).json({ message: "No data provided for import" });
    }

    console.log(`Received ${data.length} rows to insert`);
    await insertDataInBatches(data, 500);

    res
      .status(200)
      .json({ message: "Local Congregation data imported successfully!" });
  } catch (error) {
    console.error("Error processing import:", error);
    res.status(500).json({ message: "Server error while importing data" });
  }
};

// ✅ Get all local congregations OR filter by district_id
exports.getLocalCongregationsByDistrict = async (req, res) => {
  try {
    const { district_id } = req.query; // Get district_id from query params

    if (!district_id) {
      return res.status(400).json({ message: "Missing district_id parameter" });
    }

    // Fetch local congregations for the given district_id
    const localCongregations = await LocalCongregation.findAll({
      where: { district_id }, // Filtering using Sequelize ORM
      order: [["name", "ASC"]], // Order by name
      include: [
        {
          model: District, // Ensure District is associated in Sequelize models
          attributes: ["id", "name"], // Only fetch needed district fields
        },
      ],
    });

    if (localCongregations.length === 0) {
      return res
        .status(404)
        .json({ message: "No local congregations found for this district" });
    }

    res.status(200).json(localCongregations);
  } catch (error) {
    console.error("Error retrieving local congregations:", error);
    res
      .status(500)
      .json({ message: "Error retrieving local congregations", error });
  }
};

// Get all local congregations ordered by name
exports.getAllLocalCongregations = async (req, res) => {
  try {
    const localCongregations = await LocalCongregation.findAll({
      order: [["name", "ASC"]],
    });
    res.status(200).json(localCongregations);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving local congregations", error });
  }
};

// Get a single local congregation by ID
exports.getLocalCongregationById = async (req, res) => {
  try {
    const localCongregation = await LocalCongregation.findByPk(req.params.id);
    if (!localCongregation) {
      return res.status(404).json({ message: "Local congregation not found" });
    }
    res.status(200).json(localCongregation);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving local congregation", error });
  }
};

// Create a new local congregation
exports.createLocalCongregation = async (req, res) => {
  try {
    const newLocalCongregation = await LocalCongregation.create(req.body);
    res.status(201).json({
      message: "Local congregation created successfully",
      localCongregation: newLocalCongregation,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating local congregation", error });
  }
};

// Update a local congregation by ID
exports.updateLocalCongregation = async (req, res) => {
  try {
    const localCongregation = await LocalCongregation.findByPk(req.params.id);
    if (!localCongregation) {
      return res.status(404).json({ message: "Local congregation not found" });
    }

    await localCongregation.update(req.body);
    res.status(200).json({
      message: "Local congregation updated successfully",
      localCongregation,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating local congregation", error });
  }
};

// Delete a local congregation by ID
exports.deleteLocalCongregation = async (req, res) => {
  try {
    const localCongregation = await LocalCongregation.findByPk(req.params.id);
    if (!localCongregation) {
      return res.status(404).json({ message: "Local congregation not found" });
    }

    await localCongregation.destroy();
    res
      .status(200)
      .json({ message: "Local congregation deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting local congregation", error });
  }
};
