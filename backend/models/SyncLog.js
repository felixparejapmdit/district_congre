const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SyncLog = sequelize.define(
    "SyncLog",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        sync_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        locale_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        locale_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        field_name: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        old_value: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        new_value: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        timestamp: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "sync_logs",
        timestamps: false,
    }
);

module.exports = SyncLog;
