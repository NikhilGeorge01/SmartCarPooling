import axios from "axios";
import React, { useState } from "react";
import "./OfferRide.css"; // Make sure to create and apply the corresponding CSS file

const fetchSuggestions = async (query) => {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&addressdetails=1&limit=5`;

  try {
    const response = await axios.get(url);
    return response.data.map((item) => ({
      name: item.display_name,
      coordinates: [parseFloat(item.lat), parseFloat(item.lon)],
    }));
  } catch (error) {
    console.error("Error fetching suggestions:", error.message);
    return [];
  }
};

const OfferRide = () => {
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [seats, setSeats] = useState("");
  const [startPoint, setStartPoint] = useState("");
  const [endPoint, setEndPoint] = useState("");
  const [startCoordinates, setStartCoordinates] = useState(null);
  const [endCoordinates, setEndCoordinates] = useState(null);
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleStartInputChange = async (e) => {
    const query = e.target.value;
    setStartPoint(query);
    setStartCoordinates(null);

    if (query.length > 2) {
      const suggestions = await fetchSuggestions(query);
      setStartSuggestions(suggestions);
    } else {
      setStartSuggestions([]);
    }
  };

  const handleEndInputChange = async (e) => {
    const query = e.target.value;
    setEndPoint(query);
    setEndCoordinates(null);

    if (query.length > 2) {
      const suggestions = await fetchSuggestions(query);
      setEndSuggestions(suggestions);
    } else {
      setEndSuggestions([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      if (!startCoordinates || !endCoordinates) {
        setError("Please select a valid start and end location.");
        setLoading(false);
        return;
      }

      await axios.post(
        "http://localhost:5000/api/rides/offer",
        {
          vehicleName,
          vehicleNumber,
          seats: parseInt(seats),
          startPoint: startCoordinates,
          endPoint: endCoordinates,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess("Ride offered successfully");
      setVehicleName("");
      setVehicleNumber("");
      setSeats("");
      setStartPoint("");
      setEndPoint("");
      setStartCoordinates(null);
      setEndCoordinates(null);
      setStartSuggestions([]);
      setEndSuggestions([]);
    } catch (error) {
      setError(error.response?.data?.message || "Error offering ride");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="offer-ride-container">
      <h2>Offer a Ride</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Vehicle Name:</label>
          <input
            type="text"
            value={vehicleName}
            onChange={(e) => setVehicleName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Vehicle Number:</label>
          <input
            type="text"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Number of Seats:</label>
          <input
            type="number"
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Start Location:</label>
          <input
            type="text"
            value={startPoint}
            onChange={handleStartInputChange}
            required
          />
          <ul>
            {startSuggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => {
                  setStartPoint(suggestion.name);
                  setStartCoordinates(suggestion.coordinates);
                  setStartSuggestions([]);
                }}
              >
                {suggestion.name}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <label>End Location:</label>
          <input
            type="text"
            value={endPoint}
            onChange={handleEndInputChange}
            required
          />
          <ul>
            {endSuggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => {
                  setEndPoint(suggestion.name);
                  setEndCoordinates(suggestion.coordinates);
                  setEndSuggestions([]);
                }}
              >
                {suggestion.name}
              </li>
            ))}
          </ul>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Offering Ride..." : "Offer Ride"}
        </button>
      </form>
    </div>
  );
};

export default OfferRide;
