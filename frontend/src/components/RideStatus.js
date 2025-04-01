import React, { useEffect, useState } from "react";
import axios from "axios";
import "./RideStatus.css";

const RideStatus = () => {
  const [completedRides, setCompletedRides] = useState([]);
  const [incompleteRides, setIncompleteRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRideStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Fetch rides stored in the user's rideStore
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RideStatus;
