const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const District = require("./District");

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
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    // Updated to handle complex schedule strings or JSON
    schedule: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Flexible URL for the congregation photo
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Stores phone numbers or emails
    contact: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // New: Link for "Open Maps" button
    google_maps_link: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    // New: Proximity data from Templo Central
    air_distance: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    road_distance: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    travel_time: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    // New: Difference from Philippine Time (e.g., "-12 hours")
    timezone_diff: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    // Soft-delete flag: false = locale removed from official site, ID preserved
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    }
  },
  {
    tableName: "local_congregation",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// ✅ Define the association
LocalCongregation.belongsTo(District, { foreignKey: "district_id" });
District.hasMany(LocalCongregation, { foreignKey: "district_id" });

module.exports = LocalCongregation;