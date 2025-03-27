const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  let token = req.header("Authorization")?.split(" ")[1]; // Check Authorization header

  if (!token) {
    token = req.query.token; // Check token in query parameters
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token." });
  }
};

module.exports = verifyToken;
