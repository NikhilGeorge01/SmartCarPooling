const express = require("express");
const bcrypt = require("bcryptjs");
const verifyToken = require("../middleware/authMiddleware");
const User = require("../models/User");
const { updateProfile } = require("../controllers/userController"); // Correctly import updateProfile

const router = express.Router();

// ✅ GET /api/user/profile - Fetch user profile (Protected Route)
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // Exclude password
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ PUT /api/user/profile - Update user profile (Protected Route)
router.put("/profile", verifyToken, updateProfile);

module.exports = router;
