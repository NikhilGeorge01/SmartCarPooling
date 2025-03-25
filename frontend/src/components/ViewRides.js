import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ViewRides.css";

const ViewRides = () => {
  const [yourRides, setYourRides] = useState([]);
  const [publicRides, setPublicRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);
  const [userDetails, setUserDetails] = useState({});

  const getLocationName = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      return response.data?.display_name || "Unknown Location";
    } catch (err) {
      console.error("Error fetching location name:", err);
      return "Unknown Location";
    }
  };

  const fetchRidesWithLocations = async () => {
    setLoading(true);
    try {
      const userResponse = await axios.get(
        "http://localhost:5000/api/auth/me",
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setUserId(userResponse.data._id);
      setUserDetails(userResponse.data);

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

      setYourRides(ridesWithLocations.filter((ride) => ride.user._id === userResponse.data._id));
      setPublicRides(ridesWithLocations.filter((ride) => ride.user._id !== userResponse.data._id));
    } catch (err) {
      console.error("Error fetching rides:", err);
      setError("Error fetching rides");
    }
    setLoading(false);
  };

  const sendEmail = async (ride) => {
    try {
      await axios.post("http://localhost:5000/api/email/send", {
        to: ride.user.email,
        subject: "Ride Request",
        body: `
          Hello ${ride.user.name},
          ${userDetails.name} has requested to join your ride.
          Click here to chat: http://localhost:3000/chat/${userDetails._id}
        `,
      });
      alert("Email sent successfully!");
    } catch (err) {
      console.error("Error sending email:", err);
      alert("Failed to send email.");
    }
  };

  useEffect(() => {
    fetchRidesWithLocations();
  }, []);

  return (
    <div className="rides-container">
      <h2>Your Rides</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && yourRides.length === 0 && <p>No rides posted by you.</p>}
      <ul className="rides-list">
        {yourRides.map((ride) => (
          <li key={ride._id} className="ride-card">
            <p><strong>Vehicle:</strong> {ride.vehicleName} ({ride.vehicleNumber})</p>
            <p><strong>Seats:</strong> {ride.seats}</p>
            <p><strong>Start:</strong> {ride.startLocation}</p>
            <p><strong>End:</strong> {ride.endLocation}</p>
          </li>
        ))}
      </ul>

      <h2>Available Public Rides</h2>
      {!loading && publicRides.length === 0 && <p>No available public rides.</p>}
      <ul className="rides-list">
        {publicRides.map((ride) => (
          <li key={ride._id} className="ride-card">
            <p><strong>Vehicle:</strong> {ride.vehicleName} ({ride.vehicleNumber})</p>
            <p><strong>Seats:</strong> {ride.seats}</p>
            <p><strong>User:</strong> {ride.user?.name || "N/A"}</p>
            <p><strong>Trust Score:</strong> {ride.user?.trust_score || "N/A"}</p>
            <p><strong>Start:</strong> {ride.startLocation}</p>
            <p><strong>End:</strong> {ride.endLocation}</p>
            <button className="request-button" onClick={() => sendEmail(ride)}>Request Ride</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ViewRides;
