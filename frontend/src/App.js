import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { Link } from "react-router-dom"; // Import Link
import Login from "./components/Login";
import Register from "./components/Register";
import Logout from "./components/Logout";
import Profile from "./components/Profile"; // Import Profile component
import VerifyEmail from "./components/VerifyEmail"; // Import VerifyEmail component
import OfferRide from "./components/OfferRide"; // Import OfferRide component
import ViewRides from "./components/ViewRides"; // Import ViewRides component
import Users from "./components/Users";
import Chat from "./components/Chat";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <Router>
      <div>
        {/* Navigation Bar */}
        <nav>
          <ul>
            {!isLoggedIn ? (
              <>
                <li>
                  <Link to="/login">Login</Link>
                </li>
                <li>
                  <Link to="/register">Register</Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/profile">Profile</Link>
                </li>
                <li>
                  <Link to="/offer-ride">Offer Ride</Link>
                </li>
                <li>
                  <Link to="/view-rides">View Rides</Link>
                </li>
                <li>
                  <Link to="/users">Users</Link>
                </li>
                <li>
                  <Logout setIsLoggedIn={setIsLoggedIn} />
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/users" element={<Users />} />
          <Route path="/chat/:userId" element={<Chat />} />
          <Route
            path="/login"
            element={
              !isLoggedIn ? (
                <Login setToken={(token) => setIsLoggedIn(!!token)} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/register"
            element={!isLoggedIn ? <Register /> : <Navigate to="/" />}
          />
          <Route
            path="/logout"
            element={
              isLoggedIn ? (
                <Logout setIsLoggedIn={setIsLoggedIn} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/profile"
            element={isLoggedIn ? <Profile /> : <Navigate to="/login" />}
          />
          <Route
            path="/offer-ride"
            element={isLoggedIn ? <OfferRide /> : <Navigate to="/login" />}
          />
          <Route
            path="/view-rides"
            element={isLoggedIn ? <ViewRides /> : <Navigate to="/login" />}
          />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route
            path="/"
            element={
              isLoggedIn ? (
                <h2>Welcome to the Home Page</h2>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
