const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  gender: { type: String, required: true },
  rating: { type: Number, default: 5 },
  preferences: { type: Object, default: {} },
  profilePic: { type: String }, // Added profilePic field
  isVerified: { type: Boolean, default: false }, // Added isVerified field
  verificationToken: { type: String }, // Added verificationToken field
});

module.exports = mongoose.model("User", UserSchema);
