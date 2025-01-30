const express = require("express");
const { register, login } = require("../controllers/authController");
const router = express.Router();

// Register Route (POST /api/auth/register)
router.post("/register", register);

// Login Route (POST /api/auth/login)
router.post("/login", login);

module.exports = router; // Make sure you are exporting the router properly
