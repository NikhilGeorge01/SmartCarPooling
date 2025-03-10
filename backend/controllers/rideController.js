const Ride = require("../models/Ride");
const User = require("../models/User");

exports.offerRide = async (req, res) => {
  const { vehicleName, vehicleNumber, seats } = req.body;
  const userId = req.user.id;

  try {
    const ride = await Ride.create({
      user: userId,
      vehicleName,
      vehicleNumber,
      seats,
    });

    res.status(201).json(ride);
  } catch (error) {
    console.error("Error offering ride:", error);
    res.status(500).json({ message: "Error offering ride", error });
  }
};

exports.getRides = async (req, res) => {
  try {
    const rides = await Ride.find().populate("user", "name trust_score");
    res.json(rides);
  } catch (error) {
    console.error("Error fetching rides:", error);
    res.status(500).json({ message: "Error fetching rides", error });
  }
};
