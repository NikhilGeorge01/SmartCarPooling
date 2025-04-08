import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import "bootstrap/dist/css/bootstrap.min.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [visitCount, setVisitCount] = useState(0); // State to track visit count
  const navigate = useNavigate();

  useEffect(() => {
    // Retrieve visit count from localStorage
    const count = localStorage.getItem("visitCount");
    const newCount = count ? parseInt(count) + 1 : 1;
    localStorage.setItem("visitCount", newCount); // Update visit count in localStorage
    setVisitCount(newCount); // Update state
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", response.data.token);
      navigate("/dashboard"); // Redirect to a protected page after successful login
    } catch (err) {
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="login-container d-flex align-items-center justify-content-center">
      <div className="login-card p-5 rounded">
        <h2 className="text-center heading-animated mb-4">Login</h2>
        <p className="text-center mb-3">Page Visits: {visitCount}</p> {/* Display visit count */}
        {error && <p className="error-message text-center">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="form-group mb-3">
            <input
              type="email"
              className="form-control custom-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group mb-4">
            <input
              type="password"
              className="form-control custom-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn cool-btn w-100">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;