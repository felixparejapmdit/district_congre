const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SyncHistory = sequelize.define(
    "SyncHistory",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        start_time: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        end_time: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: "running", // running, completed, failed
        },
        total_districts: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        total_locales: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        new_locales: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        updated_locales: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        error_message: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "sync_history",
        timestamps: false,
    }
);

module.exports = SyncHistory;
