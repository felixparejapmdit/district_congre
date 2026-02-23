const { District, LocalCongregation, SyncHistory } = require("../models");
const sequelize = require("../config/database");

exports.getStats = async (req, res) => {
    try {
        // 1. Basic Counts
        const districtCount = await District.count({
            distinct: true,
            where: { is_active: true },
            include: [{
                model: LocalCongregation,
                required: true
            }]
        });
        const congregationCount = await LocalCongregation.count();

        // 2. Regional Stats for Pie Chart
        // Group by District.region and sum congregation counts
        const regionalData = await District.findAll({
            attributes: [
                'region',
                [sequelize.fn('COUNT', sequelize.col('LocalCongregations.id')), 'count']
            ],
            where: { is_active: true },
            include: [{
                model: LocalCongregation,
                attributes: [],
                required: true
            }],
            group: ['region'],
            raw: true
        });

        const regionalStats = regionalData.map(r => ({
            name: r.region || "Unknown",
            value: parseInt(r.count)
        }));

        // 3. Sync History for Timeline Graph (last 10 runs)
        const syncHistory = await SyncHistory.findAll({
            where: { status: 'completed' },
            order: [['id', 'DESC']],
            limit: 10
        });

        res.status(200).json({
            districtCount,
            congregationCount,
            regionalStats,
            syncHistory: syncHistory.reverse() // Sort chronologically for the graph
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ message: "Error retrieving dashboard statistics", error: error.message });
    }
};
