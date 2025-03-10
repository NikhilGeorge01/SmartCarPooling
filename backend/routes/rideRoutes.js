const express = require("express");
const { offerRide, getRides } = require("../controllers/rideController");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// Offer Ride Route (POST /api/rides/offer)
router.post("/offer", verifyToken, offerRide);

// Get Rides Route (GET /api/rides)
router.get("/", getRides);

module.exports = router;
