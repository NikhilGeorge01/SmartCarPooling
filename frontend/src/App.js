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
        <nav className="bg-gray-900 text-green-400 shadow-lg shadow-green-500/50 py-4 fixed w-full z-10 top-0">
          <div className="container mx-auto flex justify-between items-center px-6">
            <h1 className="text-xl font-bold">Carpooling</h1>
            <ul className="flex space-x-6">
              {!isLoggedIn ? (
                <>
                  <li>
                    <Link
                      to="/login"
                      className="hover:text-green-300 transition duration-300"
                    >
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/register"
                      className="hover:text-green-300 transition duration-300"
                    >
                      Register
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link
                      to="/profile"
                      className="hover:text-green-300 transition duration-300"
                    >
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/offer-ride"
                      className="hover:text-green-300 transition duration-300"
                    >
                      Offer Ride
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/view-rides"
                      className="hover:text-green-300 transition duration-300"
                    >
                      View Rides
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/ride-status"
                      className="hover:text-green-300 transition duration-300"
                    >
                      Ride Status
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/users"
                      className="hover:text-green-300 transition duration-300"
                    >
                      Users
                    </Link>
                  </li>
                  <li>
                    <Logout setIsLoggedIn={setIsLoggedIn} />
                  </li>
                </>
              )}
            </ul>
          </div>
        </nav>

        {/* Page Content */}
        <div className="pt-20 px-4">
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
      </div>
    </Router>
  );
}

export default App;
