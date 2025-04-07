require("dotenv").config(); // Load environment variables
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000; // Set the port from .env or default to 5000
const MONGO_URI = process.env.MONGO_URI; // Mongo URI from .env

// Middlewares
app.use(express.json()); // For parsing application/json
app.use(cors()); // Enable CORS

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const rideRoutes = require("./routes/rideRoutes");
const emailRoutes = require("./routes/emailRoutes");
const chatRoutes = require("./routes/chatRoutes");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); // Updated to handle user-related routes
app.use("/api/rides", rideRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/chat", chatRoutes);

// Basic route for testing
app.get("/", (req, res) => {
  console.log("Basic route accessed");
  res.send("Carpool Backend Running 🚀");
});

// MongoDB Connection
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ message: "Internal Server Error" });
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
