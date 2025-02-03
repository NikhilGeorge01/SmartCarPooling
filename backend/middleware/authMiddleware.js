const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // Get token from headers
  const authHeader = req.header("Authorization");

  // Check if token exists
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  // Extract actual token (remove "Bearer " prefix)
  const token = authHeader.split(" ")[1];

  try {
    // Verify token using JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded user data to request
    next(); // Move to the next middleware or route handler
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

module.exports = verifyToken;
