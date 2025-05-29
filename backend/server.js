require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const http = require("http");
const https = require("https");

const districtsRoutes = require("./routes/districtsRoutes");
const localCongregationRoutes = require("./routes/localCongregationRoutes");
const scraperRoutes = require("./routes/scraperRoutes");

const app = express();

// Environment variables
const IP_ADDRESS = process.env.REACT_IP_ADDRESS?.replace("//", "") || "0.0.0.0";
const HTTP_PORT = parseInt(process.env.REACT_PORT_HTTP) || 80;
const HTTPS_PORT = parseInt(process.env.REACT_PORT_HTTPS) || 443;
const USE_HTTPS = process.env.HTTPS === "true";

// Middleware setup
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));
app.use(express.json());
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use(scraperRoutes);
app.use(districtsRoutes);
app.use(localCongregationRoutes);

// Server creation
if (USE_HTTPS) {
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_FILE),
    cert: fs.readFileSync(process.env.SSL_CRT_FILE),
  };

  https.createServer(options, app).listen(HTTPS_PORT, IP_ADDRESS, () => {
    console.log(
      `✅ HTTPS Server running at https://${IP_ADDRESS}:${HTTPS_PORT}`
    );
  });
} else {
  http.createServer(app).listen(HTTP_PORT, IP_ADDRESS, () => {
    console.log(`✅ HTTP Server running at http://${IP_ADDRESS}:${HTTP_PORT}`);
  });
}
