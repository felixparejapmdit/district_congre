const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AppConfig = sequelize.define(
    "AppConfig",
    {
        key: {
            type: DataTypes.STRING(50),
            primaryKey: true,
        },
        value: {
            type: DataTypes.JSON,
            allowNull: false,
        },
    },
    {
        tableName: "app_configs",
        timestamps: true,
    }
);

module.exports = AppConfig;
