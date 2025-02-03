require("dotenv").config();

const express = require("express");

const path = require("path");

const cors = require("cors");
const bodyParser = require("body-parser");

const districtsRoutes = require("./routes/districtsRoutes");
const localCongregationRoutes = require("./routes/localCongregationRoutes");

const IP_Address = process.env.REACT_IP_ADDRESS || "0.0.0.0"; // Default to listening on all interfaces

const app = express();
const PORT = process.env.REACT_PORT || 5000;

app.use(
  cors({
    origin: "*", // Allow all origins (for development)
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json()); // Middleware to parse JSON request bodies

app.use(cors({ origin: "*" }));
app.use(bodyParser.json({ limit: "100mb" })); // Increased limit to handle Base64 images
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(districtsRoutes);
app.use(localCongregationRoutes);

// --- Start server ---
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on ${IP_Address}:${PORT}`);
});
