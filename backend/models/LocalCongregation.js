const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LocalCongregation = sequelize.define(
  "LocalCongregation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    district_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "districts",
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName: "local_congregation",
    timestamps: true,
    createdAt: "created_at", // Map to 'created_at' column
    updatedAt: "updated_at", // Map to 'updated_at' column
  }
);

module.exports = LocalCongregation;
