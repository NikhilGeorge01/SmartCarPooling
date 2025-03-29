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
import "leaflet-geosearch/dist/geosearch.css"; // Import GeoSearch styles
import "./OfferRide.css";
import L from "leaflet";

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

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

  // Component to handle map clicks
  const LocationMarker = ({ setCoordinates, setPoint }) => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setCoordinates([lat, lng]);
        setPoint(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
      },
    });
    return null;
  };

  // Component to add a search bar to the map
  const SearchBar = ({ setCoordinates, setPoint }) => {
    const map = useMap();

    React.useEffect(() => {
      const provider = new OpenStreetMapProvider();

      const searchControl = new GeoSearchControl({
        provider,
        style: "bar",
        showMarker: true,
        showPopup: false,
        marker: {
          icon: new L.Icon.Default(),
          draggable: false,
        },
        maxMarkers: 1,
        retainZoomLevel: false,
        animateZoom: true,
        autoClose: true,
        searchLabel: "Enter address",
        keepResult: true,
      });

      map.addControl(searchControl);

      // Adjust map view and update coordinates when a location is selected
      map.on("geosearch/showlocation", (event) => {
        const { x, y, label } = event.location;
        setCoordinates([y, x]);
        setPoint(label);
        map.setView([y, x], 13); // Adjust map view to the searched location
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
          <p>
            {startPoint ||
              "Search or click on the map to select a start location"}
          </p>
          <MapContainer
            center={[51.505, -0.09]}
            zoom={13}
            style={{ height: "300px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <SearchBar
              setCoordinates={setStartCoordinates}
              setPoint={setStartPoint}
            />
            <LocationMarker
              setCoordinates={setStartCoordinates}
              setPoint={setStartPoint}
            />
            {startCoordinates && <Marker position={startCoordinates}></Marker>}
          </MapContainer>
        </div>
        <div>
          <label>End Location:</label>
          <p>
            {endPoint || "Search or click on the map to select an end location"}
          </p>
          <MapContainer
            center={[51.505, -0.09]}
            zoom={13}
            style={{ height: "300px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <SearchBar
              setCoordinates={setEndCoordinates}
              setPoint={setEndPoint}
            />
            <LocationMarker
              setCoordinates={setEndCoordinates}
              setPoint={setEndPoint}
            />
            {endCoordinates && <Marker position={endCoordinates}></Marker>}
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
        <button type="submit" disabled={loading}>
          {loading ? "Offering Ride..." : "Offer Ride"}
        </button>
      </form>
    </div>
  );
};

export default OfferRide;
