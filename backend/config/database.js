require("dotenv").config(); // Load environment variables from .env
const { Sequelize } = require("sequelize");

/**
 * DATABASE CONNECTION CONFIGURATION
 * Inside Docker, process.env.MYSQL_HOST should be "inc-db" 
 * as defined in your docker-compose.yml.
 */
const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE, // Database name (discongre)
  process.env.MYSQL_USER,     // Database user (discongre)
  process.env.MYSQL_PASSWORD, // Database password (M@sunur1n)
  {
    host: process.env.MYSQL_HOST || "inc-db", // Defaults to the Docker service name
    port: process.env.MYSQL_PORT || 3306,
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    dialectOptions: {
      connectTimeout: 20000, // Increased timeout for Docker initialization
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Test the connection function
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connection to MySQL (Docker: inc-db) has been established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to MySQL container:");
    console.error("   HOST:", process.env.MYSQL_HOST);
    console.error("   ERROR:", error.message);
    // Optional: process.exit(1); 
    // In production, you might want to retry rather than kill the container immediately.
  }
}

// Automatically test the connection when the app starts
testConnection();

module.exports = sequelize;