import React, { useState } from "react";
import axios from "axios";

const OfferRide = () => {
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [seats, setSeats] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    axios
      .post(
        "http://localhost:5000/api/rides/offer",
        {
          vehicleName,
          vehicleNumber,
          seats: parseInt(seats),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((response) => {
        setSuccess("Ride offered successfully");
        setVehicleName("");
        setVehicleNumber("");
        setSeats("");
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error offering ride:", error);
        setError("Error offering ride");
        setLoading(false);
      });
  };

  return (
    <div>
      <h2>Offer a Ride</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Vehicle Name:</label>
          <input
            type="text"
            value={vehicleName}
            onChange={(e) => setVehicleName(e.target.value)}
          />
        </div>
        <div>
          <label>Vehicle Number:</label>
          <input
            type="text"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
          />
        </div>
        <div>
          <label>Number of Seats:</label>
          <input
            type="number"
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Offering Ride..." : "Offer Ride"}
        </button>
      </form>
      {success && <p style={{ color: "green" }}>{success}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default OfferRide;
