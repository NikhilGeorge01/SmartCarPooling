const express = require("express");
const bcrypt = require("bcryptjs");
const verifyToken = require("../middleware/authMiddleware");
const User = require("../models/User");
const upload = require("../middleware/uploadMiddleware");

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
router.put(
  "/profile",
  verifyToken,
  upload.single("profilePic"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update fields if provided
      if (req.body.name) user.name = req.body.name;
      if (req.body.email) user.email = req.body.email;
      if (req.body.gender) user.gender = req.body.gender;
      if (req.file) user.profilePic = req.file.path;

      // If password is provided, hash it before saving
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      await user.save();

      res.json({ message: "Profile updated successfully", user });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
