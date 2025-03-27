const express = require("express");
const {
  addToCanChatWith,
  getAllUsers,
  getChatMessages,
  sendMessage,
} = require("../controllers/chatController");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// Route to update "canChatWith" field
router.get("/add-to-can-chat-with", verifyToken, addToCanChatWith);

// Get all users
router.get("/users", verifyToken, getAllUsers);

// Get chat messages between two users
router.get("/:userId", verifyToken, getChatMessages);

// Send a chat message
router.post("/", verifyToken, sendMessage);

module.exports = router;
