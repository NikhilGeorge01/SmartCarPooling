const express = require("express");
const {
  offerRide,
  getRides,
  startRide,
  finishRide,
  getRideStorage,
  getRideDetails,
  updateLocation,
  getCurrentLocation,
  addToRated,
  getBasicRideInfo,
} = require("../controllers/rideController");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// Offer Ride Route (POST /api/rides/offer)
router.post("/offer", verifyToken, offerRide);

// Get All Rides Route (GET /api/rides)
router.get("/", getRides);

// Get Ride Storage Route (GET /api/rides/storage)
router.get("/storage", verifyToken, getRideStorage);

// Get Ride Details Route (GET /api/rides/:rideId)
router.get("/:rideId", verifyToken, getRideDetails);

// Start Ride Route (PATCH /api/rides/:rideId/start)
router.patch("/:rideId/start", verifyToken, startRide);

// Finish Ride Route (PATCH /api/rides/:rideId/finish)
router.patch("/:rideId/finish", verifyToken, finishRide);

// Add User to Rated Field (PATCH /api/rides/:rideId/rated)
router.patch("/:rideId/rated", verifyToken, addToRated);

// Update Driver's Location Route (PATCH /api/rides/:rideId/location)
router.patch("/:rideId/location", verifyToken, updateLocation);

// Get Driver's Current Location Route (GET /api/rides/:rideId/location)
router.get("/:rideId/location", verifyToken, getCurrentLocation);

// Get basic ride information (minimal data for tracking)
router.get("/:rideId/basic", verifyToken, getBasicRideInfo);

module.exports = router;
