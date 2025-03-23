import React, { useEffect, useState } from "react";
import axios from "axios";

const ViewRides = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getLocationName = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      if (response.data && response.data.display_name) {
        return response.data.display_name;
      }
      return "Unknown Location";
    } catch (err) {
      console.error("Error fetching location name:", err);
      return "Unknown Location";
    }
  };

  const fetchRidesWithLocations = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/rides");
      const ridesWithLocations = await Promise.all(
        response.data.map(async (ride) => {
          const startLocation = await getLocationName(
            ride.startPoint[0],
            ride.startPoint[1]
          );
          const endLocation = await getLocationName(
            ride.endPoint[0],
            ride.endPoint[1]
          );
          return { ...ride, startLocation, endLocation };
        })
      );
      setRides(ridesWithLocations);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching rides:", err);
      setError("Error fetching rides");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRidesWithLocations();
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
            <p>User Name: {ride.user?.name || "N/A"}</p>
            <p>Trust Score: {ride.user?.trust_score || "N/A"}</p>
            <p>Start Point: {ride.startLocation}</p>
            <p>End Point: {ride.endLocation}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ViewRides;
