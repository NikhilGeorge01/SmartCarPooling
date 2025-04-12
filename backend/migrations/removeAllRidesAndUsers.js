require("dotenv").config(); // Load environment variables from .env
const mongoose = require("mongoose");
const User = require("../models/User"); // Import the User model
const Ride = require("../models/Ride"); // Import the Ride model

// MongoDB connection string from .env
const MONGO_URI =
  "mongodb+srv://userNikhil:mongo@cluster0.ynssg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Debug log to check if MONGO_URI is loaded
console.log("MONGO_URI:", MONGO_URI);

const removeAllRidesAndUsers = async () => {
  try {
    // Connect to the database
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to the database.");

    // Remove all rides
    const rideResult = await Ride.deleteMany({});
    console.log(`Removed ${rideResult.deletedCount} ride(s).`);

    // Remove all users
    const userResult = await User.deleteMany({});
    console.log(`Removed ${userResult.deletedCount} user(s).`);

    // Close the database connection
    await mongoose.connection.close();
    console.log("Disconnected from the database.");
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
};

removeAllRidesAndUsers();
