import "./Login.css";
import React, { useState, useEffect } from "react";
import { loginUser } from "../api/auth";

const Login = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visitCount, setVisitCount] = useState(0); // State to track visit count

  // Increment visit count on component mount
  useEffect(() => {
    const count = localStorage.getItem("visitCount");
    const newCount = count ? parseInt(count) + 1 : 1;
    localStorage.setItem("visitCount", newCount);
    setVisitCount(newCount);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Both fields are required");
      setLoading(false);
      return;
    }

    try {
      const response = await loginUser({ email, password });
      setToken(response.token);
      localStorage.setItem("token", response.token);
      setError(""); // Clear error if login is successful
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <p>Page Visits: {visitCount}</p> {/* Display visit count */}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
