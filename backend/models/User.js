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
  rating: { type: Number, default: 5 },
  preferences: { type: Object, default: {} },
  profilePic: { type: String }, // Added profilePic field
  isVerified: { type: Boolean, default: false }, // Added isVerified field
  verificationToken: { type: String }, // Added verificationToken field
  rides: { type: Number, default: 0 }, // New field
  avg_rating: { type: Number, default: 0 }, // New field
  trust_score: { type: Number, default: 0 }, // Added trust_score field
  chats: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Track initiated chats
  canChatWith: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
  ], // Ensure default is an empty array
});

module.exports = mongoose.model("User", UserSchema);
