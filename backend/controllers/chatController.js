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

exports.addToCanChatWith = async (req, res) => {
  const { email } = req.query; // Get the email from the query parameters
  const loggedInUserId = req.user.id; // Get the logged-in user's ID from the token

  try {
    // Find the logged-in user (user2 who clicked the link)
    const loggedInUser = await User.findById(loggedInUserId);

    // Find the target user (user1 whose email is in the hyperlink)
    const targetUser = await User.findOne({ email });

    if (!loggedInUser || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add the target user (user1) to the logged-in user's (user2) "canChatWith" list if not already present
    if (!loggedInUser.canChatWith.includes(targetUser._id)) {
      loggedInUser.canChatWith.push(targetUser._id);
      await loggedInUser.save();
    }

    // Add the logged-in user (user2) to the target user's (user1) "canChatWith" list if not already present
    if (!targetUser.canChatWith.includes(loggedInUserId)) {
      targetUser.canChatWith.push(loggedInUserId);
      await targetUser.save();
    }

    res.status(200).json({ message: "Chat access updated successfully" });
  } catch (error) {
    console.error("Error updating chat access:", error);
    res.status(500).json({ message: "Error updating chat access" });
  }
};
