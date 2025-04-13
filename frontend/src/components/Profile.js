import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [trustScore, setTrustScore] = useState(null); // Initialize trustScore state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          "http://localhost:5000/api/users/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(response.data);
        setTrustScore(response.data.trust_score); // Set trustScore from profile data
      } catch (error) {
        setError(error.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleGenerateTrustScore = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    axios
      .post(
        "http://localhost:5001/predict_trust",
        {
          rides: user.rideStore.length, // Send the count of rides in rideStore
          rating: user.rating, // Use rating instead of avg_rating
          complaints: 0, // Complaints (if applicable)
          cibil: user.cibil, // Fetch CIBIL score from the database
          twitter_username: user.twitterUsername, // Twitter username
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((response) => {
        const trustScore = response.data.trust_score;
        setTrustScore(trustScore);

        // Update the trust score in the database
        return axios.put(
          "http://localhost:5000/api/users/profile",
          { trust_score: trustScore },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      })
      .then((response) => {
        setUser(response.data); // Update user data with the new trust score
        setLoading(false);
      })
      .catch((error) => {
        setError("Error generating trust score");
        setLoading(false);
      });
  };

  if (loading) {
    return <div className="profile-message">Loading...</div>;
  }

  if (error) {
    return <div className="profile-message error-message">{error}</div>;
  }

  if (!user) {
    return <div className="profile-message">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <h2 className="profile-heading">Profile</h2>
      <div className="profile-info">
        <p>
          <strong>Name:</strong> {user.name}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Gender:</strong> {user.gender}
        </p>
        <p>
          <strong>Date of Birth:</strong>{" "}
          {new Date(user.dob).toLocaleDateString()}
        </p>
        <p>
          <strong>Twitter Username:</strong> {user.twitterUsername}
        </p>
        <p>
          <strong>Phone Number:</strong> {user.phone}
        </p>
        <p>
          <strong>Rating:</strong> {user.rating.toFixed(2)} / 5
        </p>
        <p>
          <strong>Rides:</strong> {user.rideStore.length}
        </p>
        <p>
          <strong>CIBIL Score:</strong> {user.cibil} {/* Display CIBIL score */}
        </p>
        <p>
          <strong>Trust Score:</strong>{" "}
          {trustScore !== null ? trustScore : "Not generated yet"}{" "}
          {/* Always display trust score */}
        </p>
        {user.photo && (
          <img
            src={user.photo}
            alt="Profile"
            className="profile-img"
            loading="lazy"
          />
        )}
      </div>

      <form onSubmit={handleGenerateTrustScore} className="profile-form">
        <button type="submit" className="profile-button" disabled={loading}>
          {loading ? "Generating..." : "Generate Trust Score"}
        </button>
      </form>
    </div>
  );
};

export default Profile;
