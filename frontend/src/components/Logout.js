import React from "react";
import { useNavigate } from "react-router-dom";

const Logout = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove the JWT token from localStorage
    localStorage.removeItem("token");

    // Update the logged-in state
    setIsLoggedIn(false);

    // Redirect the user to the login page
    navigate("/login");

    // Provide user feedback
    alert("Logged out successfully!");
  };

  return <button onClick={handleLogout}>Logout</button>;
};

export default Logout;
