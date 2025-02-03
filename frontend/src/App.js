import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Logout from "./components/Logout";

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
        <nav>
          <ul>
            {!isLoggedIn && (
              <>
                <li>
                  <a href="/login">Login</a>
                </li>
                <li>
                  <a href="/register">Register</a>
                </li>
              </>
            )}
            {isLoggedIn && (
              <li>
                <Logout setIsLoggedIn={setIsLoggedIn} />
              </li>
            )}
          </ul>
        </nav>
        <Routes>
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
