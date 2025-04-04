const Ride = require("../models/Ride");
const User = require("../models/User");

exports.offerRide = async (req, res) => {
  const {
    vehicleName,
    vehicleNumber,
    seats,
    startPoint,
    endPoint,
    dateOfTravel,
  } = req.body;
  const userId = req.user.id;

  try {
    const ride = await Ride.create({
      user: userId,
      vehicleName,
      vehicleNumber,
      seats,
      startPoint,
      endPoint,
      dateOfTravel, // Save the date of travel
    });

    res.status(201).json(ride);
  } catch (error) {
    console.error("Error offering ride:", error);
    res.status(500).json({ message: "Error offering ride", error });
  }
};

exports.getRides = async (req, res) => {
  try {
    const rides = await Ride.find().populate("user", "name trust_score email"); // Include the email field
    if (!rides || rides.length === 0) {
      return res.status(404).json({ message: "No rides found" });
    }
    res.status(200).json(rides);
  } catch (error) {
    console.error("Error fetching rides:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.startRide = async (req, res) => {
  const { rideId } = req.params;

  try {
    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.completed) {
      return res.status(400).json({ message: "Ride is already completed." });
    }

    ride.inProgress = true;
    await ride.save();

    res.status(200).json({ message: "Ride started successfully", ride });
  } catch (error) {
    console.error("Error starting ride:", error);
    res.status(500).json({ message: "Error starting ride", error });
  }
};

exports.finishRide = async (req, res) => {
  const { rideId } = req.params;

  try {
    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (!ride.inProgress) {
      return res.status(400).json({ message: "Ride is not in progress." });
    }

    ride.inProgress = false;
    ride.completed = true;
    await ride.save();

    res.status(200).json({ message: "Ride finished successfully", ride });
  } catch (error) {
    console.error("Error finishing ride:", error);
    res.status(500).json({ message: "Error finishing ride", error });
  }
};
exports.getRideStorage = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId).populate({
      path: "rideStore",
      populate: { path: "user", select: "name email" }, // Populate ride owner details
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.rideStore);
  } catch (error) {
    console.error("Error fetching ride storage:", error);
    res.status(500).json({ message: "Error fetching ride storage" });
  }
};
