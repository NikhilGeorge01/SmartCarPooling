import React, { useEffect, useState } from "react";
import axios from "axios";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [cibil, setCibil] = useState("");
  const [trustScore, setTrustScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("http://localhost:5000/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setUser(response.data);
        })
        .catch((error) => {
          console.error("Error fetching profile:", error);
        });
    }
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

        // Update user with the new trust score
        return axios.put(
          "http://localhost:5000/api/user/profile",
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

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Profile</h2>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
      <p>Gender: {user.gender}</p>
      <p>Date of Birth: {new Date(user.dob).toLocaleDateString()}</p>
      <p>Twitter Username: {user.twitterUsername}</p>
      <p>Phone Number: {user.phone}</p>
      {user.photo && <img src={user.photo} alt="Profile" />}
      <form onSubmit={handleCibilSubmit}>
        <div>
          <label>CIBIL Score:</label>
          <input
            type="number"
            value={cibil}
            onChange={(e) => setCibil(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Generating Trust Score..." : "Generate Trust Score"}
        </button>
      </form>
      {trustScore && <p>Trust Score: {trustScore}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default Profile;
