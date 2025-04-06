const Chat = require("../models/Chat");
const User = require("../models/User");
const Ride = require("../models/Ride");

// Get all users (for listing users to chat with)
exports.getAllUsers = async (req, res) => {
  try {
    // Fetch only verified users
    const users = await User.find({ isVerified: true }).select(
      "name email photo"
    );
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

// Get chat messages between two users
exports.getChatMessages = async (req, res) => {
  const { userId } = req.params; // The other user's ID
  const loggedInUserId = req.user.id;

  try {
    const messages = await Chat.find({
      $or: [
        { sender: loggedInUserId, receiver: userId },
        { sender: userId, receiver: loggedInUserId },
      ],
    }).sort({ timestamp: 1 }); // Sort by timestamp (oldest to newest)

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ message: "Error fetching chat messages" });
  }
};

// Send a chat message
exports.sendMessage = async (req, res) => {
  const { receiver, message } = req.body;
  const sender = req.user.id;

  try {
    const chatMessage = await Chat.create({ sender, receiver, message });
    res.status(201).json(chatMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Error sending message" });
  }
};
exports.addToCanChatWith = async (req, res) => {
  const { senderId, receiverId, rideId } = req.query;

  console.log("Sender ID:", senderId);
  console.log("Receiver ID:", receiverId);
  console.log("Ride ID:", rideId);

  try {
    // Find the sender (user1 who requested the ride)
    const sender = await User.findById(senderId);
    console.log("Sender:", sender);

    // Find the receiver (user2 who offered the ride and clicked the link)
    const receiver = await User.findById(receiverId);
    console.log("Receiver:", receiver);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the ride
    const ride = await Ride.findById(rideId);
    console.log("Ride:", ride);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Check if the sender is already a passenger in the ride
    if (ride.passengers.includes(sender._id)) {
      return res.status(400).json({
        message: "Passenger already exists in the ride.",
      });
    }

    // Add the sender to the ride's passengers array
    ride.passengers.push(sender._id);

    // Check if the ride already exists in the sender's rideStore
    const existingRequest = sender.rideStore.find(
      (entry) => entry.toString() === rideId.toString()
    );

    if (existingRequest) {
      return res.status(400).json({
        message: "Ride already exists in the user's ride storage.",
      });
    }

    // Add the ride to the sender's rideStore
    sender.rideStore.push(ride._id);

    // Save both the ride and the sender
    await ride.save();
    await sender.save();

    res.status(200).json({
      message: "Passenger added to the ride successfully.",
    });
  } catch (error) {
    console.error("Error updating ride request:", error);
    res.status(500).json({
      message: "Error updating ride request.",
    });
  }
};
