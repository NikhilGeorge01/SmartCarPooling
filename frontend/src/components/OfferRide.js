import axios from "axios";
import React, { useState } from "react";

const fetchSuggestions = async (query) => {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&addressdetails=1&limit=5`;

  try {
    const response = await axios.get(url);
    return response.data.map((item) => ({
      name: item.display_name,
      coordinates: [parseFloat(item.lat), parseFloat(item.lon)], // [latitude, longitude]
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
    setStartCoordinates(null); // Reset selected coordinates

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
    setEndCoordinates(null); // Reset selected coordinates

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
        setError(
          "Please select a valid start and end location from the suggestions."
        );
        setLoading(false);
        return;
      }

      console.log("Submitting ride with:", {
        vehicleName,
        vehicleNumber,
        seats,
        startPoint: startCoordinates, // [lat, lon]
        endPoint: endCoordinates, // [lat, lon]
      });

      await axios.post(
        "http://localhost:5000/api/rides/offer",
        {
          vehicleName,
          vehicleNumber,
          seats: parseInt(seats),
          startPoint: startCoordinates, // Send as [lat, lon]
          endPoint: endCoordinates, // Send as [lat, lon]
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
      setLoading(false);
    } catch (error) {
      console.error(
        "Error offering ride:",
        error.response ? error.response.data : error.message
      );
      setError(error.response?.data?.message || "Error offering ride");
      setLoading(false);
    }
  };

  return (
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
                setStartCoordinates(suggestion.coordinates); // ✅ Store coordinates
                setStartSuggestions([]);
              }}
              style={{ cursor: "pointer" }}
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
                setEndCoordinates(suggestion.coordinates); // ✅ Store coordinates
                setEndSuggestions([]);
              }}
              style={{ cursor: "pointer" }}
            >
              {suggestion.name}
            </li>
          ))}
        </ul>
      </div>
      <button type="submit" disabled={loading}>
        {loading ? "Offering Ride..." : "Offer Ride"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
    </form>
  );
};

export default OfferRide;
