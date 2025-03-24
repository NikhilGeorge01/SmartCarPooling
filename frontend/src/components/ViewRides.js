import React, { useEffect, useState } from "react";
import axios from "axios";

const ViewRides = () => {
  const [yourRides, setYourRides] = useState([]);
  const [publicRides, setPublicRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null); // Store logged-in user ID
  const [userDetails, setUserDetails] = useState({}); // Store logged-in user's details

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
      // Fetch the logged-in user's ID and details
      const userResponse = await axios.get(
        "http://localhost:5000/api/auth/me",
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      const loggedInUserId = userResponse.data._id;
      setUserId(loggedInUserId);
      setUserDetails(userResponse.data);

      console.log("Fetching all rides...");
      const response = await axios.get("http://localhost:5000/api/rides");
      console.log(`Fetched ${response.data.length} rides`);

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

      console.log("Filtering your rides and public rides...");
      const userRides = ridesWithLocations.filter(
        (ride) => ride.user._id === loggedInUserId
      );
      const availableRides = ridesWithLocations.filter(
        (ride) => ride.user._id !== loggedInUserId
      );

      console.log(
        `Your rides: ${userRides.length}, Public rides: ${availableRides.length}`
      );

      setYourRides(userRides);
      setPublicRides(availableRides);
    } catch (err) {
      console.error("Error fetching rides:", err);
      setError("Error fetching rides");
    }
    setLoading(false);
  };

  const sendEmail = async (ride) => {
    try {
      const emailData = {
        to: ride.user.email, // Email of the ride offerer
        subject: "Ride Request",
        body: `
          Hello ${ride.user.name},
  
          ${
            userDetails.name
          } has requested to join your ride. Here are their details:
          - Trust Score: ${userDetails.trust_score || "Yet to be calculated"}
          - Number of Rides: ${userDetails.rides || "0"}
          - Average Rating: ${userDetails.avg_rating || "0"}
  
          Click the link below to start a chat with ${userDetails.name}:
          http://localhost:3000/chat/${userDetails._id}
  
          Thank you,
          Ride Sharing App
        `,
      };

      await axios.post("http://localhost:5000/api/email/send", emailData);
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
    <div>
      <h2>Your Rides</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {yourRides.length === 0 && !loading && <p>No rides posted by you.</p>}
      <ul>
        {yourRides.map((ride) => (
          <li key={ride._id}>
            <p>Vehicle Name: {ride.vehicleName}</p>
            <p>Vehicle Number: {ride.vehicleNumber}</p>
            <p>Number of Seats: {ride.seats}</p>
            <p>Start Point: {ride.startLocation}</p>
            <p>End Point: {ride.endLocation}</p>
          </li>
        ))}
      </ul>

      <h2>Available Public Rides</h2>
      {publicRides.length === 0 && !loading && (
        <p>No available public rides.</p>
      )}
      <ul>
        {publicRides.map((ride) => (
          <li key={ride._id}>
            <p>Vehicle Name: {ride.vehicleName}</p>
            <p>Vehicle Number: {ride.vehicleNumber}</p>
            <p>Number of Seats: {ride.seats}</p>
            <p>User Name: {ride.user?.name || "N/A"}</p>
            <p>Trust Score: {ride.user?.trust_score || "N/A"}</p>
            <p>Start Point: {ride.startLocation}</p>
            <p>End Point: {ride.endLocation}</p>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                sendEmail(ride);
              }}
            >
              Request Ride
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ViewRides;
