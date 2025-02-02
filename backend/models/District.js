const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const District = sequelize.define(
  "District",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    region: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    tableName: "districts",
    timestamps: true,
    createdAt: "created_at", // Map to 'created_at' column
    updatedAt: "updated_at", // Map to 'updated_at' column
  }
);

module.exports = District;
