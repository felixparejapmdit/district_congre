require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http"); // We only need HTTP inside the container
const sequelize = require("./config/database");

const districtsRoutes = require("./routes/districtsRoutes");
const localCongregationRoutes = require("./routes/localCongregationRoutes");
const scraperRoutes = require("./routes/scraperRoutes");
const exportRoutes = require('./routes/exportRoutes');
const dashboardRoutes = require("./routes/dashboardRoutes");
const syncRoutes = require("./routes/syncRoutes");

const app = express();

// Docker sets PORT=3000 via docker-compose.yml; locally we use 3001 to avoid conflict with React dev server (port 3000)
const PORT = process.env.PORT || 3001;
const IP_ADDRESS = "0.0.0.0"; // Required for Docker to bind correctly

// Middleware setup
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));
app.use(express.json());
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use(scraperRoutes);
app.use(districtsRoutes);
app.use(localCongregationRoutes);
app.use("/api", exportRoutes);
app.use(dashboardRoutes);
app.use(syncRoutes);

// Start simple HTTP server (Nginx will handle the HTTPS part)
sequelize.sync({ alter: true }).then(() => {
  console.log("✅ Database synced successfully");
  http.createServer(app).listen(PORT, IP_ADDRESS, () => {
    console.log(`✅ Backend running internally on port ${PORT}`);
  });
}).catch((err) => {
  console.error("❌ Database sync failed:", err);
});