const express = require("express");
const Ride = require("../models/Ride.js");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * ✅ Create a Ride
 * @route POST /api/ride/create
 */
router.post("/create", verifyToken, async (req, res) => {
  try {
    const { pickup, destination, date, availableSeats } = req.body;

    const newRide = new Ride({
      driver: req.user.id, // Driver is the authenticated user
      pickup,
      destination,
      date,
      availableSeats,
    });

    await newRide.save();
    res
      .status(201)
      .json({ message: "Ride created successfully", ride: newRide });
  } catch (error) {
    console.error("Error creating ride:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ✅ Fetch All Available Rides
 * @route GET /api/ride/available
 */
router.get("/available", async (req, res) => {
  try {
    const rides = await Ride.find({ availableSeats: { $gt: 0 } }).populate(
      "driver",
      "name"
    );
    res.json(rides);
  } catch (error) {
    console.error("Error fetching rides:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ✅ Join a Ride
 * @route PUT /api/ride/join/:rideId
 */
router.put("/join/:rideId", verifyToken, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.availableSeats <= 0)
      return res.status(400).json({ message: "No seats available" });

    if (ride.passengers.includes(req.user.id))
      return res.status(400).json({ message: "You are already in this ride" });

    ride.passengers.push(req.user.id);
    ride.availableSeats -= 1;
    await ride.save();

    res.json({ message: "Joined the ride successfully", ride });
  } catch (error) {
    console.error("Error joining ride:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
