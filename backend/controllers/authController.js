const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.register = async (req, res) => {
  const { name, email, password, gender, dob, twitterUsername, phone, photo } =
    req.body;

  console.log("Register request received:", {
    name,
    email,
    password,
    gender,
    dob,
    twitterUsername,
    phone,
    photo,
  });

  // Check if the user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");

  try {
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      gender,
      dob,
      twitterUsername, // Ensure this field is handled
      phone,
      photo,
      verificationToken,
      rides: 0, // Initialize to 0
      avg_rating: 0, // Initialize to 0
    });

    console.log("User created:", user);

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    await transporter.sendMail({
      to: email,
      subject: "Email Verification",
      html: `<p>Please verify your email by clicking the following link: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
    });

    console.log("Verification email sent to:", email);

    res.status(201).json({
      message:
        "User registered successfully. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Error registering user:", error); // Log the error
    res.status(500).json({ message: "Error registering user", error });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error verifying email", error });
  }
};

// Login User
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  // Check if the user is verified
  if (!user.isVerified)
    return res
      .status(403)
      .json({ message: "Please verify your email to login" });

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  // Generate JWT token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  res.json({ token });
};
