import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [cibil, setCibil] = useState("");
  const [trustScore, setTrustScore] = useState(null);
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
      } catch (error) {
        setError(error.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleCibilSubmit = (e) => {
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
          rides: user.rides,
          avg_rating: user.avg_rating,
          complaints: 0,
          cibil: parseInt(cibil),
          twitter_username: user.twitterUsername,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((response) => {
        const trustScore = response.data.trust_score;
        setTrustScore(trustScore);

        return axios.put(
          "http://localhost:5000/api/users/profile",
          { trust_score: trustScore },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      })
      .then((response) => {
        setUser(response.data);
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
        </p>{" "}
        {/* Display the rating */}
        {user.photo && (
          <img
            src={user.photo}
            alt="Profile"
            className="profile-img"
            loading="lazy"
          />
        )}
      </div>

      <form onSubmit={handleCibilSubmit} className="profile-form">
        <label className="profile-label">CIBIL Score:</label>
        <input
          type="number"
          className="profile-input"
          value={cibil}
          onChange={(e) => setCibil(e.target.value)}
          required
        />
        <button type="submit" className="profile-button" disabled={loading}>
          {loading ? "Generating..." : "Generate Trust Score"}
        </button>
      </form>

      {trustScore && <p className="trust-score">Trust Score: {trustScore}</p>}
    </div>
  );
};

export default Profile;
