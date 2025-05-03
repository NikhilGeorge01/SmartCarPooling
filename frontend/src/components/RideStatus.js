import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./RideStatus.css";

const RideStatus = () => {
  const [completedRides, setCompletedRides] = useState([]);
  const [incompleteRides, setIncompleteRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const navigate = useNavigate();

  const fetchRideStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Fetch current user details using the getMe endpoint
      const userResponse = await axios.get(
        "http://localhost:5000/api/auth/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const userId = userResponse.data._id; // Fetch the user ID from the response
      setLoggedInUserId(userId);

      // Fetch all rides from the database
      const response = await axios.get(
        "http://localhost:5000/api/rides/storage",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Separate completed and incomplete rides
      const completed = response.data.filter((ride) => ride.completed);
      const incomplete = response.data.filter((ride) => !ride.completed);

      setCompletedRides(completed);
      setIncompleteRides(incomplete);
    } catch (err) {
      console.error("Error fetching ride status:", err);
      setError("Failed to fetch ride status.");
    }
    setLoading(false);
  };

  const handleTrackClick = (rideId) => {
    navigate(`/ride-tracking/${rideId}`);
  };

  const handleRateClick = (rideId) => {
    // Redirect to the RateRide page with the ride ID
    navigate(`/rate-ride/${rideId}`);

    // Update the completedRides array locally after rating
    setCompletedRides((prevRides) =>
      prevRides.map((ride) =>
        ride._id === rideId
          ? { ...ride, rated: [...ride.rated, loggedInUserId] }
          : ride
      )
    );
  };

  useEffect(() => {
    fetchRideStatus();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (completedRides.length === 0 && incompleteRides.length === 0) {
    return <p className="no-rides-message">No rides in your storage.</p>;
  }

  return (
    <div className="ride-status-container">
      <h2>Your Ride Status</h2>

      {/* Incomplete Rides Section */}
      <div className="incomplete-rides">
        <h3>Incomplete Rides</h3>
        {incompleteRides.length === 0 ? (
          <p>No incomplete rides.</p>
        ) : (
          <ul className="rides-list">
            {incompleteRides.map((ride) => (
              <li key={ride._id} className="ride-card">
                <p>
                  <strong>Vehicle:</strong> {ride.vehicleName} (
                  {ride.vehicleNumber})
                </p>
                <p>
                  <strong>Seats:</strong> {ride.seats}
                </p>
                <p>
                  <strong>Start Location:</strong> {ride.startPoint.join(", ")}
                </p>
                <p>
                  <strong>End Location:</strong> {ride.endPoint.join(", ")}
                </p>
                <p>
                  <strong>Date of Travel:</strong>{" "}
                  {new Date(ride.dateOfTravel).toLocaleDateString()}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {ride.inProgress ? "In Progress" : "Not Started"}
                </p>
                {ride.inProgress && (
                  <button
                    className="track-button"
                    onClick={() => handleTrackClick(ride._id)}
                  >
                    Track
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Completed Rides Section */}
      <div className="completed-rides">
        <h3>Completed Rides</h3>
        {completedRides.length === 0 ? (
          <p>No completed rides.</p>
        ) : (
          <ul className="rides-list">
            {completedRides.map((ride) => (
              <li key={ride._id} className="ride-card">
                <p>
                  <strong>Vehicle:</strong> {ride.vehicleName} (
                  {ride.vehicleNumber})
                </p>
                <p>
                  <strong>Seats:</strong> {ride.seats}
                </p>
                <p>
                  <strong>Start Location:</strong> {ride.startPoint.join(", ")}
                </p>
                <p>
                  <strong>End Location:</strong> {ride.endPoint.join(", ")}
                </p>
                <p>
                  <strong>Date of Travel:</strong>{" "}
                  {new Date(ride.dateOfTravel).toLocaleDateString()}
                </p>
                <p>
                  <strong>Status:</strong> Completed
                </p>
                <p>
                  <strong>Rated By (Names):</strong>{" "}
                  {ride.rated.length > 0 ? (
                    <ul>
                      {ride.rated.map((user) => (
                        <li key={user._id}>{user.name}</li> // Display user names
                      ))}
                    </ul>
                  ) : (
                    "No ratings yet"
                  )}
                </p>
                <button
                  className="rate-button"
                  onClick={() => handleRateClick(ride._id)} // Redirect to RateRide.js
                  disabled={ride.rated.some(
                    (user) => user._id === loggedInUserId
                  )} // Disable if user has already rated
                >
                  {ride.rated.some((user) => user._id === loggedInUserId)
                    ? "Already Rated"
                    : "Rate"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RideStatus;
