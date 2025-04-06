import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./RateRide.css";

const RateRide = () => {
  const { rideId } = useParams(); // Get the ride ID from the URL
  const [rideDetails, setRideDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ratedUsers, setRatedUsers] = useState({}); // Track users who have been rated

  const fetchRideDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Fetch ride details
      const response = await axios.get(
        `http://localhost:5000/api/rides/${rideId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setRideDetails(response.data);
    } catch (err) {
      console.error("Error fetching ride details:", err);
      setError("Failed to fetch ride details. Please ensure the ride exists.");
    }
    setLoading(false);
  };

  useEffect(() => {
    console.log("Ride ID:", rideId); // Debug log for rideId
    fetchRideDetails();
  }, [rideId]);

  const handleRate = async (userId, role, ratingValue) => {
    if (ratingValue < 0 || ratingValue > 5) {
      alert("Rating must be between 0 and 5.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Send the rating to the backend
      await axios.post(
        `http://localhost:5000/api/users/${userId}/rate`,
        { value: ratingValue },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Mark the user as rated
      setRatedUsers((prev) => ({ ...prev, [userId]: true }));

      alert(`Successfully rated ${role} with ${ratingValue} stars.`);
    } catch (err) {
      console.error("Error submitting rating:", err);
      alert("Failed to submit rating. Please try again.");
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!rideDetails) {
    return <p>No ride details available.</p>;
  }

  return (
    <div className="rate-ride-container">
      <h2>Rate Ride</h2>

      {/* Ride Owner Section */}
      <h3>Ride Owner</h3>
      <div className="ride-owner">
        <p>
          <strong>Name:</strong> {rideDetails.user.name}
        </p>
        <p>
          <strong>Email:</strong> {rideDetails.user.email}
        </p>
        {!ratedUsers[rideDetails.user._id] ? (
          <div>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              placeholder="Rate (0-5)"
              id={`rating-owner-${rideDetails.user._id}`}
            />
            <button
              className="rate-button"
              onClick={() =>
                handleRate(
                  rideDetails.user._id,
                  "Owner",
                  parseFloat(
                    document.getElementById(
                      `rating-owner-${rideDetails.user._id}`
                    ).value
                  )
                )
              }
            >
              Rate Owner
            </button>
          </div>
        ) : (
          <p>Already Rated</p>
        )}
      </div>

      {/* Passengers Section */}
      <h3>Passengers</h3>
      {rideDetails.passengers.length === 0 ? (
        <p>No passengers for this ride.</p>
      ) : (
        <ul className="passenger-list">
          {rideDetails.passengers.map((passenger) => (
            <li key={passenger._id} className="passenger-card">
              <p>
                <strong>Name:</strong> {passenger.name}
              </p>
              <p>
                <strong>Email:</strong> {passenger.email}
              </p>
              {!ratedUsers[passenger._id] ? (
                <div>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    placeholder="Rate (0-5)"
                    id={`rating-passenger-${passenger._id}`}
                  />
                  <button
                    className="rate-button"
                    onClick={() =>
                      handleRate(
                        passenger._id,
                        "Passenger",
                        parseFloat(
                          document.getElementById(
                            `rating-passenger-${passenger._id}`
                          ).value
                        )
                      )
                    }
                  >
                    Rate Passenger
                  </button>
                </div>
              ) : (
                <p>Already Rated</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RateRide;
