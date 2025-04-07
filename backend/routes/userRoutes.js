const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const {
  getProfile,
  updateProfile,
  rateUser,
} = require("../controllers/userController");

const router = express.Router();

// ✅ GET /api/user/profile - Fetch user profile (Protected Route)
router.get("/profile", verifyToken, getProfile);

// ✅ POST /api/users/:userId/rate - Rate a user (Protected Route)
router.post("/:userId/rate", verifyToken, rateUser);

// ✅ PUT /api/user/profile - Update user profile (Protected Route)
router.put("/profile", verifyToken, updateProfile);

module.exports = router;
