import React from "react";
import { useNavigate } from "react-router-dom";
import "./Logout.css"; // Import the CSS file for styling

const Logout = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove the JWT token from localStorage
    localStorage.removeItem("token");

    // Update the logged-in state
    setIsLoggedIn(false);

    // Redirect the user to the login page
    navigate("/login");

    // Show a logout success message
    alert("Logged out successfully!");
  };

  return (
    <button className="logout-button" onClick={handleLogout}>
      Logout
    </button>
  );
};

export default Logout;