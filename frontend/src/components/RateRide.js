import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./RateRide.css";

const RateRide = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [rideDetails, setRideDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ratings, setRatings] = useState({});
  const [loggedInUserId, setLoggedInUserId] = useState(null);

  const fetchRideDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `http://localhost:5000/api/rides/${rideId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRideDetails(response.data);

      const profileResponse = await axios.get(
        `http://localhost:5000/api/users/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setLoggedInUserId(profileResponse.data._id);
    } catch (err) {
      console.error("Error fetching ride details:", err);
      setError("Failed to fetch ride details. Please ensure the ride exists.");
    }
    setLoading(false);
  };

  useEffect(() => {
    console.log("Ride ID:", rideId);
    fetchRideDetails();
  }, [rideId]);

  const handleRatingChange = (userId, value) => {
    setRatings((prev) => ({
      ...prev,
      [userId]: value,
    }));
  };

  const handleSubmitRatings = async () => {
    try {
      const token = localStorage.getItem("token");

      const ratingPromises = Object.entries(ratings).map(([userId, value]) =>
        axios.post(
          `http://localhost:5000/api/users/${userId}/rate`,
          { value, rideId },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
      );

      await Promise.all(ratingPromises);
      alert("Ratings submitted successfully!");
      navigate("/ride-status");
    } catch (err) {
      console.error("Error submitting ratings:", err);
      alert("Failed to submit ratings. Please try again.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!rideDetails) return <p>No ride details available.</p>;

  return (
    <div className="rate-ride-container">
      <h2>Rate Ride</h2>
      <h3>Ride Owner</h3>
      {rideDetails.user._id !== loggedInUserId && (
        <div className="ride-owner">
          <p><strong>Name:</strong> {rideDetails.user.name}</p>
          <p><strong>Email:</strong> {rideDetails.user.email}</p>
          <input
            type="number"
            min="0"
            max="5"
            step="0.1"
            placeholder="Rate (0-5)"
            value={ratings[rideDetails.user._id] || ""}
            onChange={(e) =>
              handleRatingChange(
                rideDetails.user._id,
                parseFloat(e.target.value)
              )
            }
          />
        </div>
      )}

      <h3>Passengers</h3>
      {rideDetails.passengers.length === 0 ? (
        <p>No passengers for this ride.</p>
      ) : (
        <ul className="passenger-list">
          {rideDetails.passengers
            .filter((p) => p._id !== loggedInUserId)
            .map((p) => (
              <li key={p._id} className="passenger-card">
                <p><strong>Name:</strong> {p.name}</p>
                <p><strong>Email:</strong> {p.email}</p>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="Rate (0-5)"
                  value={ratings[p._id] || ""}
                  onChange={(e) =>
                    handleRatingChange(p._id, parseFloat(e.target.value))
                  }
                />
              </li>
            ))}
        </ul>
      )}

      <button className="submit-ratings-button" onClick={handleSubmitRatings}>
        Submit Ratings
      </button>
    </div>
  );
};

export default RateRide;
