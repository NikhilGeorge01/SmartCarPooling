const User = require("../models/User");

exports.updateProfile = async (req, res) => {
  const { trust_score } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.trust_score = trust_score;
    await user.save();

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

  if (value < 0 || value > 5) {
    return res.status(400).json({ message: "Rating must be between 0 and 5." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add the rating to the user's ratingList
    user.ratingList.push({ rater: raterId, value });

    // Save the user (this will trigger the pre-save middleware to update the average rating)
    await user.save();

    res.status(200).json({ message: "Rating submitted successfully", user });
  } catch (error) {
    console.error("Error submitting rating:", error);
    res.status(500).json({ message: "Error submitting rating" });
  }
};
