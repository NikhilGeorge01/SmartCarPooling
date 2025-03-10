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
