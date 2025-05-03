import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ViewRides.css";
import { Button } from "react-bootstrap";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const ViewRides = () => {
  const navigate = useNavigate();
  const [yourRides, setYourRides] = useState([]);
  const [publicRides, setPublicRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [requestedRides, setRequestedRides] = useState(
    JSON.parse(localStorage.getItem("requestedRides")) || {}
  );
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationInterval, setLocationInterval] = useState(null);

  const getLocationName = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      return response.data?.display_name || "Unknown Location";
    } catch {
      return "Unknown Location";
    }
  };

  const fetchRidesWithLocations = async () => {
    setLoading(true);
    try {
      const userResponse = await axios.get(
        "http://localhost:5000/api/auth/me",
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setUserId(userResponse.data._id);
      setUserDetails(userResponse.data);

      const response = await axios.get("http://localhost:5000/api/rides", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

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

      setYourRides(
        ridesWithLocations.filter(
          (ride) => ride.user._id === userResponse.data._id
        )
      );
      setPublicRides(
        ridesWithLocations.filter(
          (ride) => ride.user._id !== userResponse.data._id && !ride.completed
        )
      );
    } catch (err) {
      setError("Error fetching rides");
    }
    setLoading(false);
  };

  const startRide = async (rideId) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/rides/${rideId}/start`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      alert("Ride started successfully!");

      // Start location tracking
      const interval = setInterval(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            try {
              await axios.patch(
                `http://localhost:5000/api/rides/${rideId}/location`,
                { latitude, longitude },
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                }
              );
              setCurrentLocation([latitude, longitude]);
            } catch (err) {
              console.error("Error updating location:", err);
            }
          });
        }
      }, 7000);

      setLocationInterval(interval);
      fetchRidesWithLocations();
    } catch {
      alert("Failed to start ride.");
    }
  };

  const finishRide = async (rideId) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/rides/${rideId}/finish`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      alert("Ride finished successfully!");

      // Stop location tracking
      if (locationInterval) {
        clearInterval(locationInterval);
        setLocationInterval(null);
      }

      fetchRidesWithLocations();
    } catch {
      alert("Failed to finish ride.");
    }
  };

  const sendEmail = async (ride) => {
    try {
      const token = localStorage.getItem("token");
      const emailData = {
        to: ride.user.email,
        subject: "Ride Request",
        body: `Hello ${ride.user.name},\n\n${
          userDetails.name
        } has requested to join your ride.\n\nTrust Score: ${
          userDetails.trust_score || "N/A"
        }\nRides: ${userDetails.rides || "0"}\nAverage Rating: ${
          userDetails.avg_rating || "0"
        }\n\nChat: http://localhost:5000/api/chat/add-to-can-chat-with?senderId=${userId}&receiverId=${
          ride.user._id
        }&rideId=${ride._id}&token=${token}`,
      };
      await axios.post("http://localhost:5000/api/email/send", emailData);
      const updatedRequestedRides = {
        ...requestedRides,
        [ride._id]: Date.now(),
      };
      setRequestedRides(updatedRequestedRides);
      localStorage.setItem(
        "requestedRides",
        JSON.stringify(updatedRequestedRides)
      );
      alert("Email sent successfully!");
    } catch (err) {
      alert("Failed to send email.");
    }
  };

  const handleTrackClick = (rideId) => {
    navigate(`/ride-tracking/${rideId}`);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setRequestedRides((prev) => {
        const updated = { ...prev };
        const now = Date.now();
        const cooldown = 12 * 60 * 60 * 1000;
        Object.keys(updated).forEach((rideId) => {
          if (now - updated[rideId] >= cooldown) delete updated[rideId];
        });
        localStorage.setItem("requestedRides", JSON.stringify(updated));
        return updated;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchRidesWithLocations();
  }, []);

  return (
    <motion.div
      className="rides-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <h2 className="neon-heading">Your Rides</h2>
      {loading && <p className="loading">Loading...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && yourRides.length === 0 && <p>No rides posted by you.</p>}
      <ul className="rides-list">
        {yourRides.map((ride) => (
          <motion.li
            key={ride._id}
            className="ride-card"
            whileHover={{ scale: 1.02 }}
          >
            <p>
              <strong>Vehicle:</strong> {ride.vehicleName} ({ride.vehicleNumber}
              )
            </p>
            <p>
              <strong>Seats:</strong> {ride.seats - ride.passengers.length}
            </p>
            <p>
              <strong>Start:</strong> {ride.startLocation}
            </p>
            <p>
              <strong>End:</strong> {ride.endLocation}
            </p>
            <p>
              <strong>Date of Travel:</strong>{" "}
              {new Date(ride.dateOfTravel).toLocaleDateString()}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {ride.completed
                ? "Completed"
                : ride.inProgress
                ? "In Progress"
                : "Not Started"}
            </p>
            {!ride.inProgress && !ride.completed && (
              <Button
                className="start-button"
                onClick={() => startRide(ride._id)}
              >
                Start Ride
              </Button>
            )}
            {ride.inProgress && !ride.completed && (
              <Button
                className="finish-button"
                onClick={() => finishRide(ride._id)}
              >
                Finish Ride
              </Button>
            )}
            {ride.inProgress && (
              <Button
                className="track-button"
                onClick={() => handleTrackClick(ride._id)}
              >
                Track
              </Button>
            )}
          </motion.li>
        ))}
      </ul>

      <h2 className="neon-heading">Available Public Rides</h2>
      {!loading && publicRides.length === 0 && (
        <p>No available public rides.</p>
      )}
      <ul className="rides-list">
        {publicRides.map((ride) => (
          <motion.li
            key={ride._id}
            className="ride-card"
            whileHover={{ scale: 1.02 }}
          >
            <p>
              <strong>Vehicle:</strong> {ride.vehicleName} ({ride.vehicleNumber}
              )
            </p>
            <p>
              <strong>Seats:</strong> {ride.seats - ride.passengers.length}
            </p>
            <p>
              <strong>User:</strong> {ride.user?.name || "N/A"}
            </p>
            <p>
              <strong>Trust Score:</strong> {ride.user?.trust_score || "N/A"}
            </p>
            <p>
              <strong>Start:</strong> {ride.startLocation}
            </p>
            <p>
              <strong>End:</strong> {ride.endLocation}
            </p>
            <p>
              <strong>Date of Travel:</strong>{" "}
              {ride.dateOfTravel
                ? new Date(ride.dateOfTravel).toLocaleDateString()
                : "N/A"}
            </p>
            {ride.passengers.includes(userId) ? (
              <Button className="accepted-button" disabled>
                Accepted
              </Button>
            ) : requestedRides[ride._id] ? (
              <Button className="requested-button" disabled>
                Requested
              </Button>
            ) : (
              <Button
                className="request-button"
                onClick={() => sendEmail(ride)}
              >
                Request Ride
              </Button>
            )}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
};

export default ViewRides;
