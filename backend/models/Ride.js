const mongoose = require("mongoose");

const RideSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  vehicleName: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  seats: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  startPoint: { type: [Number], required: true }, // [latitude, longitude]
  endPoint: { type: [Number], required: true }, // [latitude, longitude]
  dateOfTravel: { type: Date, required: true }, // Ensure this is a Date type
  inProgress: { type: Boolean, default: false }, // New field to track if the ride is in progress
  completed: { type: Boolean, default: false }, // New field to track if the ride is completed
});

module.exports = mongoose.model("Ride", RideSchema);
