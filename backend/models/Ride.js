const mongoose = require("mongoose");

const RideSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  vehicleName: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  seats: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  startPoint: { type: [Number], required: true }, // [latitude, longitude]
  endPoint: { type: [Number], required: true }, // [latitude, longitude]
  dateOfTravel: { type: Date, required: true },
  inProgress: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  passengers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Array of passenger IDs
  currentLocation: { type: [Number], default: null }, // [latitude, longitude]
  locationAccuracy: { type: Number, default: null }, // accuracy in meters
  locationLastUpdated: { type: Date, default: null }, // New field for last updated location
  rated: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }], // New field to track users who rated
});

RideSchema.methods.addPassenger = function (userId) {
  if (!this.passengers.includes(userId)) {
    this.passengers.push(userId);
  }
};

module.exports = mongoose.model("Ride", RideSchema);
