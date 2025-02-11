const mongoose = require("mongoose");

const RideSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  pickup: {
    address: String,
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  destination: {
    address: String,
    coordinates: { type: [Number], required: true },
  },
  date: { type: Date, required: true },
  availableSeats: { type: Number, required: true },
  passengers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("Ride", RideSchema);
