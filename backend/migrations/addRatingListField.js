require("dotenv").config(); // Load environment variables from .env
const mongoose = require("mongoose");
const User = require("../models/User"); // Import the User model

// MongoDB connection string from .env
const MONGO_URI =
  "mongodb+srv://userNikhil:mongo@cluster0.ynssg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Debug log to check if MONGO_URI is loaded
console.log("MONGO_URI:", MONGO_URI);

const addRatingListField = async () => {
  try {
    // Connect to the database
    await mongoose.connect(MONGO_URI);
    console.log("Connected to the database.");

    // Update all users to add the `ratingList` field if it doesn't exist
    const result = await User.updateMany(
      { ratingList: { $exists: false } }, // Check if `ratingList` does not exist
      { $set: { ratingList: [] } } // Add `ratingList` as an empty array
    );

    console.log(`Migration complete. Modified ${result.nModified} user(s).`);

    // Close the database connection
    await mongoose.disconnect();
    console.log("Disconnected from the database.");
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
};

addRatingListField();
