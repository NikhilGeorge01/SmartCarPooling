const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  gender: { type: String, required: true },
  dob: { type: Date, required: true }, // Added DOB field
  twitterUsername: { type: String, required: true }, // Added Twitter Username field
  phone: { type: String, required: true }, // Added Phone Number field
  photo: { type: String }, // Added Photo field
  rating: { type: Number, default: 5 }, // Average rating
  ratingList: [
    {
      rater: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // User who gave the rating
      value: { type: Number, required: true, min: 1, max: 5 }, // Rating value (1-5)
    },
  ], // List of individual ratings
  preferences: { type: Object, default: {} },
  profilePic: { type: String }, // Added profilePic field
  isVerified: { type: Boolean, default: false }, // Added isVerified field
  verificationToken: { type: String }, // Added verificationToken field
  rides: { type: Number, default: 0 }, // New field
  trust_score: { type: Number, default: 0 }, // Added trust_score field
  chats: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Track initiated chats
  canChatWith: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
  ], // Ensure default is an empty array
  rideStore: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Ride", default: [] }, // New field to store ride IDs
  ],
});

// Pre-save middleware to calculate the average rating
// Pre-save middleware to calculate the average rating
UserSchema.pre("save", function (next) {
  // Check if the ratingList field is modified
  if (this.isModified("ratingList")) {
    if (this.ratingList.length > 0) {
      const total = this.ratingList.reduce(
        (sum, rating) => sum + rating.value,
        0
      );
      this.rating = total / this.ratingList.length; // Calculate average rating
    } else {
      this.rating = 5; // Default rating if no ratings exist
    }
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
