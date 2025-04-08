import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Link,
} from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Logout from "./components/Logout";
import Profile from "./components/Profile";
import VerifyEmail from "./components/VerifyEmail";
import OfferRide from "./components/OfferRide";
import ViewRides from "./components/ViewRides";
import Users from "./components/Users";
import Chat from "./components/Chat";
import RideStatus from "./components/RideStatus";
import RateRide from "./components/RateRide";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

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
      <div className="app-container">
        {/* Navigation Bar */}
        <nav className="navbar navbar-expand-lg custom-navbar fixed-top px-4">
          <div className="container-fluid">
            <Link className="navbar-brand heading-animated" to="/">
              SmartCarpooling
            </Link>
            <div className="collapse navbar-collapse justify-content-end">
              <ul className="navbar-nav">
                {!isLoggedIn ? (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link nav-text" to="/login">
                        Login
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link nav-text" to="/register">
                        Register
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link nav-text" to="/profile">
                        Profile
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link nav-text" to="/offer-ride">
                        Offer Ride
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link nav-text" to="/view-rides">
                        View Rides
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link nav-text" to="/ride-status">
                        Ride Status
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link nav-text" to="/users">
                        Users
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Logout setIsLoggedIn={setIsLoggedIn} />
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div className="main-content pt-5">
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
              path="/ride-status"
              element={isLoggedIn ? <RideStatus /> : <Navigate to="/login" />}
            />
            <Route path="/rate-ride/:rideId" element={<RateRide />} />
            <Route
              path="/view-rides"
              element={isLoggedIn ? <ViewRides /> : <Navigate to="/login" />}
            />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route
              path="/"
              element={
                isLoggedIn ? (
                  <div className="home-page d-flex flex-column align-items-center justify-content-center text-center">
                    <h1 className="display-3 heading-animated mt-5">Welcome to SmartCarpooling</h1>
                    <p className="lead main-desc">Smart Carpooling for a Greener Future</p>
                    <Link to="/offer-ride" className="btn cool-btn mt-3">Offer a Ride</Link>
                  </div>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
