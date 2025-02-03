const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  gender: { type: String, required: true },
  rating: { type: Number, default: 5 },
  preferences: { type: Object, default: {} },
});

module.exports = mongoose.model("User", UserSchema);
