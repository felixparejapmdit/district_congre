const District = require("../models/District");
const LocalCongregation = require("../models/LocalCongregation");

exports.getStats = async (req, res) => {
    try {
        const districtCount = await District.count();
        const congregationCount = await LocalCongregation.count();

        res.status(200).json({
            districtCount,
            congregationCount
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ message: "Error retrieving dashboard statistics", error });
    }
};
