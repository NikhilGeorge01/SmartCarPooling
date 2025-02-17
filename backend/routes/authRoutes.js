const express = require("express");
const {
  register,
  login,
  verifyEmail,
} = require("../controllers/authController");
const router = express.Router();

// Register Route (POST /api/auth/register)
router.post("/register", register);

// Login Route (POST /api/auth/login)
router.post("/login", login);

// Email Verification Route (GET /api/auth/verify-email)
router.get("/verify-email", verifyEmail);

module.exports = router;
