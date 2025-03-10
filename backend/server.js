require("dotenv").config(); // Load environment variables
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path"); // Import the path module

const app = express();
const PORT = process.env.PORT || 5000; // Set the port from .env or default to 5000
const MONGO_URI = process.env.MONGO_URI; // Mongo URI from .env

// Middlewares
app.use(express.json()); // For parsing application/json
app.use(cors()); // Enable CORS

// Serve static files from the "uploads" directory
// Adjusted path

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/user", userRoutes);

const rideRoutes = require("./routes/rideRoutes");
app.use("/api/rides", rideRoutes);

// Basic route for testing (This should be at the top)
app.get("/", (req, res) => {
  console.log("Basic route accessed");
  res.send("Carpool Backend Running 🚀");
});

// MongoDB Connection
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
