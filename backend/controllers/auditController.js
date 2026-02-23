const { SyncLog, SyncHistory, AppConfig } = require("../models");

exports.getGlobalLogs = async (req, res) => {
    try {
        const logs = await SyncLog.findAll({
            order: [['timestamp', 'DESC']],
            limit: 200
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: "Error fetching logs" });
    }
};

exports.getReferencePoint = async (req, res) => {
    try {
        const config = await AppConfig.findOne({ where: { key: "reference_point" } });
        res.json(config ? config.value : { lat: 14.6508, lng: 121.0505, name: "Templo Central" });
    } catch (error) {
        res.status(500).json({ message: "Error fetching reference point" });
    }
};

exports.updateReferencePoint = async (req, res) => {
    try {
        const { lat, lng, name } = req.body;
        if (!lat || !lng || !name) {
            return res.status(400).json({ message: "Missing coordinates or name" });
        }

        const [config, created] = await AppConfig.findOrCreate({
            where: { key: "reference_point" },
            defaults: { key: "reference_point", value: { lat, lng, name } }
        });

        if (!created) {
            await config.update({ value: { lat, lng, name } });
        }

        res.json({ message: "Reference point updated successfully", value: { lat, lng, name } });
    } catch (error) {
        res.status(500).json({ message: "Error updating reference point" });
    }
};

exports.getSyncHistory = async (req, res) => {
    try {
        const history = await SyncHistory.findAll({
            order: [['start_time', 'DESC']],
            limit: 50
        });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: "Error fetching sync history" });
    }
};
