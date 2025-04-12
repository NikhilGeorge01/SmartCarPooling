import axios from "axios";
import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet/dist/leaflet.css";
import "leaflet-geosearch/dist/geosearch.css";
import "./OfferRide.css";
import L from "leaflet";
import { Spinner } from "react-bootstrap";

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Function to check if coordinates are in India using Nominatim
const isPointInIndia = async (lat, lng) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const address = response.data.address;
    return address && address.country === "India";
  } catch (error) {
    console.error("Error checking location with Nominatim:", error);
    return false;
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
  const [dateOfTravel, setDateOfTravel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const LocationMarker = ({ setCoordinates, setPoint }) => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;

        // Check if the selected location is within India
        const isInIndia = await isPointInIndia(lat, lng);
        if (isInIndia) {
          setCoordinates([lat, lng]);
          setPoint(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
        } else {
          alert("Please select a location within India.");
        }
      },
    });
    return null;
  };

  const SearchBar = ({ setCoordinates, setPoint }) => {
    const map = useMap();

    React.useEffect(() => {
      const provider = new OpenStreetMapProvider();
      const searchControl = new GeoSearchControl({
        provider,
        style: "bar",
        showMarker: true,
        marker: { icon: new L.Icon.Default() },
        maxMarkers: 1,
        autoClose: true,
        searchLabel: "Enter address",
        keepResult: true,
      });

      map.addControl(searchControl);
      map.on("geosearch/showlocation", async (event) => {
        const { x, y, label } = event.location;

        // Check if the searched location is within India
        const isInIndia = await isPointInIndia(y, x);
        if (isInIndia) {
          setCoordinates([y, x]);
          setPoint(label);
          map.setView([y, x], 13);
        } else {
          alert("Please search for a location within India.");
        }
      });

      return () => map.removeControl(searchControl);
    }, [map, setCoordinates, setPoint]);

    return null;
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

      // Check if both start and end locations are in India
      const isStartInIndia = await isPointInIndia(
        startCoordinates[0],
        startCoordinates[1]
      );
      const isEndInIndia = await isPointInIndia(
        endCoordinates[0],
        endCoordinates[1]
      );

      if (!isStartInIndia || !isEndInIndia) {
        setError("Both start and end locations must be within India.");
        setLoading(false);
        return;
      }

      // Push the ride into the database
      await axios.post(
        "http://localhost:5000/api/rides/offer",
        {
          vehicleName,
          vehicleNumber,
          seats: parseInt(seats),
          startPoint: startCoordinates,
          endPoint: endCoordinates,
          dateOfTravel,
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
      setDateOfTravel("");
    } catch (error) {
      setError(error.response?.data?.message || "Error offering ride");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="offer-ride-container">
      <h2 className="neon-heading">Offer a Ride</h2>
      {error && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}
      <form onSubmit={handleSubmit} className="neon-form">
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
          <p className="helper-text">
            {startPoint ||
              "Search or click on the map to select a start location"}
          </p>
          <MapContainer
            center={[20.5937, 78.9629]} // Default center: India
            zoom={5} // Zoom level for India
            style={{ height: "300px", width: "100%", marginBottom: "1rem" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <SearchBar
              setCoordinates={setStartCoordinates}
              setPoint={setStartPoint}
            />
            <LocationMarker
              setCoordinates={setStartCoordinates}
              setPoint={setStartPoint}
            />
            {startCoordinates && <Marker position={startCoordinates} />}
          </MapContainer>
        </div>
        <div>
          <label>End Location:</label>
          <p className="helper-text">
            {endPoint || "Search or click on the map to select an end location"}
          </p>
          <MapContainer
            center={[20.5937, 78.9629]} // Default center: India
            zoom={5} // Zoom level for India
            style={{ height: "300px", width: "100%", marginBottom: "1rem" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <SearchBar
              setCoordinates={setEndCoordinates}
              setPoint={setEndPoint}
            />
            <LocationMarker
              setCoordinates={setEndCoordinates}
              setPoint={setEndPoint}
            />
            {endCoordinates && <Marker position={endCoordinates} />}
          </MapContainer>
        </div>
        <div>
          <label>Date of Travel:</label>
          <input
            type="date"
            value={dateOfTravel}
            onChange={(e) => setDateOfTravel(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="neon-button" disabled={loading}>
          {loading ? (
            <Spinner animation="border" variant="light" size="sm" />
          ) : (
            "Offer Ride"
          )}
        </button>
      </form>
    </div>
  );
};

export default OfferRide;
