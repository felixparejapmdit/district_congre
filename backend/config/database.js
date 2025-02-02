require("dotenv").config(); // Load environment variables from .env
const { Sequelize } = require("sequelize");

// Create a new Sequelize instance with environment variables
const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE, // Database name
  process.env.MYSQL_USER, // Database user
  process.env.MYSQL_PASSWORD, // Database password
  {
    host: process.env.MYSQL_HOST, // Database host
    port: process.env.MYSQL_PORT || 3306, // Use a default port if not provided
    dialect: "mysql", // Specify MySQL as the dialect
    logging: process.env.NODE_ENV === "development" ? console.log : false, // Enable logging only in development
    dialectOptions: {
      connectTimeout: 10000, // Set a timeout for the connection
    },
    pool: {
      max: 5, // Maximum number of connections in the pool
      min: 0, // Minimum number of connections in the pool
      acquire: 30000, // Maximum time (ms) to acquire a connection before throwing an error
      idle: 10000, // Time (ms) a connection can be idle before being released
    },
  }
);

// Test the connection function
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connection to MySQL has been established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to MySQL:", error.message);
    console.error("Details:", error); // Include full error details for debugging
    process.exit(1); // Exit with a failure code to indicate the connection failed
  }
}

// Call the test function to check the connection
if (require.main === module) {
  // Only test the connection if this file is executed directly
  testConnection();
}

module.exports = sequelize;
