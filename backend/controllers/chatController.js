const Chat = require("../models/Chat");
const User = require("../models/User");

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
