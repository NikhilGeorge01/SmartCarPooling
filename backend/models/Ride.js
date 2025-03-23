const mongoose = require("mongoose");

const RideSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  vehicleName: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  seats: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  startPoint: { type: [Number], required: true }, // [latitude, longitude]
  endPoint: { type: [Number], required: true }, // [latitude, longitude]
});

module.exports = mongoose.model("Ride", RideSchema);
