// filepath: [authRoutes.js](http://_vscodecontentref_/7)
const express = require("express");
const {
  register,
  login,
  verifyEmail,
  getMe,
} = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// Register Route (POST /api/auth/register)
router.post("/register", register);

// Login Route (POST /api/auth/login)
router.post("/login", login);

// Email Verification Route (GET /api/auth/verify-email)
router.get("/verify-email", verifyEmail);

// Get Logged-In User Details (GET /api/auth/me)
router.get("/me", verifyToken, getMe);

module.exports = router;
