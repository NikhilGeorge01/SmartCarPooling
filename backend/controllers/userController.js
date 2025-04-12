const User = require("../models/User");

exports.getProfile = async (req, res) => {
  try {
    console.log("Fetching profile for user ID:", req.user.id);

    const user = await User.findById(req.user.id).select("-password"); // Exclude password
    if (!user) {
      console.error("User not found:", req.user.id);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Profile fetched successfully for user:", user.name);
    res.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updateProfile = async (req, res) => {
  const { trust_score } = req.body;
  const userId = req.user.id;

  try {
    console.log("Updating profile for user ID:", userId);

    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    user.trust_score = trust_score;
    await user.save();

    console.log("Profile updated successfully for user:", user.name);
    res.json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile", error });
  }
};

exports.rateUser = async (req, res) => {
  const { userId } = req.params;
  const { value } = req.body;
  const raterId = req.user.id;

  console.log("Received rating request:");
  console.log(
    `Rater ID: ${raterId}, User ID: ${userId}, Rating Value: ${value}`
  );

  if (value < 1 || value > 5) {
    console.error("Invalid rating value:", value);
    return res.status(400).json({ message: "Rating must be between 1 and 5." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found:", user.name);

    // Check if the rater has already rated the user
    const existingRatingIndex = user.ratingList.findIndex(
      (rating) => rating.rater.toString() === raterId
    );

    if (existingRatingIndex !== -1) {
      // Update the existing rating
      user.ratingList[existingRatingIndex].value = value;
    } else {
      // Add a new rating
      user.ratingList.push({ rater: raterId, value });
    }

    // Save the user to trigger the `pre-save` middleware
    await user.save();

    console.log("Rating saved successfully for user:", user.name);

    res.status(200).json({ message: "Rating submitted successfully", user });
  } catch (error) {
    console.error("Error submitting rating:", error);
    res.status(500).json({ message: "Error submitting rating" });
  }
};
