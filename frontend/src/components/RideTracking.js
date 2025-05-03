import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, useMap, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./RideTracking.css";

// Fix Leaflet marker icon issue
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
}

// Rate limiting setup for Nominatim
const NOMINATIM_DELAY = 1000;
let lastNominatimRequest = 0;

const RideTracking = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [basicRideInfo, setBasicRideInfo] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [locationName, setLocationName] = useState("");
  const [locationError, setLocationError] = useState(null);

  // Fetch only basic ride info initially
  const fetchBasicRideInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/rides/${rideId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setBasicRideInfo(response.data);
      if (response.data.currentLocation) {
        setCurrentLocation(response.data.currentLocation);
        setLastUpdated(
          new Date(response.data.locationLastUpdated).toLocaleString()
        );
        fetchLocationName(
          response.data.currentLocation[0],
          response.data.currentLocation[1]
        );
      }
    } catch (err) {
      console.error("Error fetching ride info:", err);
      setError("Failed to load ride details");
    } finally {
      setIsLoading(false);
    }
  }, [rideId, navigate]);

  const fetchLocationName = async (lat, lon) => {
    try {
      const now = Date.now();
      const timeToWait = Math.max(
        0,
        NOMINATIM_DELAY - (now - lastNominatimRequest)
      );
      if (timeToWait > 0) {
        await new Promise((resolve) => setTimeout(resolve, timeToWait));
      }
      lastNominatimRequest = Date.now();

      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        {
          headers: {
            "User-Agent": "SmartCarpooling/1.0",
            "Accept-Language": "en",
          },
        }
      );
      if (response.data.display_name) {
        setLocationName(response.data.display_name);
      }
    } catch (err) {
      console.error("Error fetching location name:", err);
    }
  };

  const handleLocationError = (error) => {
    console.error("Geolocation error:", error);
    let errorMessage = "Error getting location. ";
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage += "Please enable location services in your browser.";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage += "Location information is unavailable.";
        break;
      case error.TIMEOUT:
        errorMessage += "Location request timed out.";
        break;
      default:
        errorMessage += "An unknown error occurred.";
    }
    setLocationError(errorMessage);
  };

  const updateLocation = useCallback(
    async (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        await axios.patch(
          `http://localhost:5000/api/rides/${rideId}/location`,
          {
            latitude,
            longitude,
            accuracy,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCurrentLocation([latitude, longitude]);
        setAccuracy(accuracy);
        setLastUpdated(new Date().toLocaleString());
        fetchLocationName(latitude, longitude);
        setLocationError(null);
      } catch (err) {
        console.error("Error updating location:", err);
      }
    },
    [rideId]
  );

  // Start location tracking
  useEffect(() => {
    let watchId = null;

    if (navigator.geolocation) {
      // First try to get a high-accuracy position
      navigator.geolocation.getCurrentPosition(
        updateLocation,
        () => {
          // If high accuracy fails, try with lower accuracy
          navigator.geolocation.getCurrentPosition(
            updateLocation,
            handleLocationError,
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 0,
            }
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );

      // Then set up continuous tracking
      watchId = navigator.geolocation.watchPosition(
        updateLocation,
        handleLocationError,
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [updateLocation]);

  // Initial data fetch
  useEffect(() => {
    fetchBasicRideInfo();
  }, [fetchBasicRideInfo]);

  if (isLoading) {
    return <div className="tracking-loading">Loading ride details...</div>;
  }

  if (error) {
    return <div className="tracking-error">{error}</div>;
  }

  if (!basicRideInfo) {
    return <div className="tracking-error">Ride not found</div>;
  }

  return (
    <div className="ride-tracking-container">
      <h2>Tracking Ride</h2>
      <div className="ride-details">
        <p>
          <strong>Vehicle:</strong> {basicRideInfo.vehicleName} (
          {basicRideInfo.vehicleNumber})
        </p>
        <p>
          <strong>Status:</strong>{" "}
          {basicRideInfo.completed ? "Completed" : "In Progress"}
        </p>
        <p>
          <strong>Last Updated:</strong> {lastUpdated || "Not yet updated"}
        </p>
        {accuracy && (
          <p>
            <strong>Location Accuracy:</strong> ±{Math.round(accuracy)} meters
          </p>
        )}
        {locationName && (
          <p>
            <strong>Current Location:</strong> {locationName}
          </p>
        )}
        {locationError && <p className="location-error">{locationError}</p>}
      </div>
      {currentLocation && (
        <div className="tracking-map">
          <MapContainer
            center={currentLocation}
            zoom={16}
            style={{ height: "400px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={currentLocation} />
            {accuracy && (
              <Circle
                center={currentLocation}
                radius={accuracy}
                fillColor="#3388ff"
                fillOpacity={0.2}
                color="#3388ff"
                weight={1}
              />
            )}
            <MapUpdater center={currentLocation} zoom={16} />
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default RideTracking;
