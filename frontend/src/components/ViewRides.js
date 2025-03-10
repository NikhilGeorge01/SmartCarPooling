import React, { useEffect, useState } from "react";
import axios from "axios";

const ViewRides = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    axios
      .get("http://localhost:5000/api/rides")
      .then((response) => {
        setRides(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching rides:", error);
        setError("Error fetching rides");
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h2>Available Rides</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {rides.map((ride) => (
          <li key={ride._id}>
            <p>Vehicle Name: {ride.vehicleName}</p>
            <p>Vehicle Number: {ride.vehicleNumber}</p>
            <p>Number of Seats: {ride.seats}</p>
            <p>User Name: {ride.user.name}</p>
            <p>Trust Score: {ride.user.trust_score}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ViewRides;
