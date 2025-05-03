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

// Cache for geocoding results
const geocodeCache = new Map();

// Rate limiting queue
const queue = [];
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests as per Nominatim policy

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to check if coordinates are in India using Nominatim with improvements
const isPointInIndia = async (lat, lng) => {
  // First check the bounding box for quick validation
  const indiaBBox = {
    north: 35.5,
    south: 6.5,
    west: 68.1,
    east: 97.4,
  };

  const isInBBox =
    lat >= indiaBBox.south &&
    lat <= indiaBBox.north &&
    lng >= indiaBBox.west &&
    lng <= indiaBBox.east;

  if (!isInBBox) {
    return false;
  }

  // Check cache first
  const cacheKey = `${lat},${lng}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  try {
    // Implement rate limiting
    const now = Date.now();
    const timeToWait = Math.max(
      0,
      MIN_REQUEST_INTERVAL - (now - lastRequestTime)
    );
    if (timeToWait > 0) {
      await sleep(timeToWait);
    }
    lastRequestTime = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse`,
      {
        params: {
          format: "json",
          lat: lat,
          lon: lng,
          "accept-language": "en",
          zoom: 12, // More detailed zoom level
          addressdetails: 1,
        },
        headers: {
          "User-Agent": "GreenPool_CarpoolApp/1.0", // Proper user agent as required by Nominatim
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const address = response.data.address;
    const isInIndia =
      address &&
      (address.country === "India" ||
        address.country_code === "in" ||
        address.country === "भारत" ||
        (response.data.display_name &&
          response.data.display_name.includes("India")));

    // Cache the result
    geocodeCache.set(cacheKey, isInIndia);

    // Cleanup cache after 1 hour
    setTimeout(() => geocodeCache.delete(cacheKey), 3600000);

    return isInIndia;
  } catch (error) {
    console.error("Error checking location with Nominatim:", error);
    // If there's an error, fall back to bounding box check
    return isInBBox;
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
      const provider = new OpenStreetMapProvider({
        params: {
          "accept-language": "en", // Preferred language
          countrycodes: "in", // Limit to India
        },
        searchUrl: "https://nominatim.openstreetmap.org/search",
        reverseUrl: "https://nominatim.openstreetmap.org/reverse",
      });

      // Wrap the provider's search method to handle errors
      const originalSearch = provider.search.bind(provider);
      provider.search = async function (...args) {
        try {
          const results = await originalSearch(...args);
          return results;
        } catch (error) {
          console.error("Search failed:", error);
          // Return empty results instead of throwing
          return [];
        }
      };

      const searchControl = new GeoSearchControl({
        provider,
        style: "bar",
        showMarker: true,
        marker: { icon: new L.Icon.Default() },
        maxMarkers: 1,
        autoClose: true,
        searchLabel: "Search for a location in India",
        keepResult: true,
        retainZoomLevel: false,
        animateZoom: true,
        showPopup: false,
        position: "topleft",
        autoComplete: true,
        autoCompleteDelay: 250,
        maxSuggestions: 5,
      });

      map.addControl(searchControl);

      map.on("geosearch/showlocation", async (event) => {
        try {
          const { x, y, label } = event.location;
          const isInIndia = await isPointInIndia(y, x);
          if (isInIndia) {
            setCoordinates([y, x]);
            setPoint(label);
            map.setView([y, x], 13);
          } else {
            alert("Please search for a location within India.");
          }
        } catch (error) {
          console.error("Error handling location:", error);
          alert("Failed to validate location. Please try again.");
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
