const sequelize = require("../config/database");
const District = require("./District");
const LocalCongregation = require("./LocalCongregation");
const SyncHistory = require("./SyncHistory");
const SyncLog = require("./SyncLog");
const AppConfig = require("./AppConfig");

// Associations
District.hasMany(LocalCongregation, { foreignKey: "district_id" });
LocalCongregation.belongsTo(District, { foreignKey: "district_id" });

SyncHistory.hasMany(SyncLog, { foreignKey: "sync_id" });
SyncLog.belongsTo(SyncHistory, { foreignKey: "sync_id" });

SyncLog.belongsTo(LocalCongregation, { foreignKey: "locale_id" });

module.exports = {
    sequelize,
    District,
    LocalCongregation,
    SyncHistory,
    SyncLog,
    AppConfig,
};
