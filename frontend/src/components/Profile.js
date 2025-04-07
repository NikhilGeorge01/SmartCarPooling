// filepath: [Profile.js](http://_vscodecontentref_/2)
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
        console.error("No token found");
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching profile...");
        const response = await axios.get(
          "http://localhost:5000/api/users/profile", // Corrected endpoint
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Profile fetched successfully:", response.data);
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError(
          error.response?.data?.message ||
            "Failed to load profile. Please try again."
        );
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
          "http://localhost:5000/api/users/profile", // Corrected endpoint
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
        console.error("Error generating trust score:", error);
        setError("Error generating trust score");
        setLoading(false);
      });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!user) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <h2>Profile</h2>
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
      {user.photo && (
        <img
          src={user.photo}
          alt="Profile"
          className="profile-img"
          loading="lazy"
        />
      )}

      <form onSubmit={handleCibilSubmit} className="profile-form">
        <div>
          <label>CIBIL Score:</label>
          <input
            type="number"
            value={cibil}
            onChange={(e) => setCibil(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Generating Trust Score..." : "Generate Trust Score"}
        </button>
      </form>

      {trustScore && <p className="trust-score">Trust Score: {trustScore}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default Profile;
