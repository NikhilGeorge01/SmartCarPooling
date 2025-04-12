import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./VerifyEmail.css";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Verifying the token, please wait..."); // Default message
  const [showPopup, setShowPopup] = useState(false); // State to control popup visibility
  const [messageType, setMessageType] = useState("info"); // Default message type
  const [isLoading, setIsLoading] = useState(true); // State to track loading
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      axios
        .get(`http://localhost:5000/api/auth/verify-email?token=${token}`)
        .then((response) => {
          setMessage(response.data.message);
          setMessageType("success"); // Set message type to success
          setShowPopup(true); // Show the popup
          setIsLoading(false); // Stop loading
          setTimeout(() => {
            navigate("/login"); // Redirect to login after showing the popup
          }, 3000);
        })
        .catch((err) => {
          const errorMessage =
            err.response?.data?.message ||
            "Email verification failed. The token may be invalid or expired.";
          setMessage(errorMessage);
          setMessageType("error"); // Set message type to error
          setShowPopup(true); // Show the popup
          setIsLoading(false); // Stop loading
          setTimeout(() => {
            setShowPopup(false); // Hide the popup after 3 seconds
          }, 3000);
        });
    } else {
      setMessage("No verification token provided.");
      setMessageType("error"); // Set message type to error
      setShowPopup(true); // Show the popup
      setIsLoading(false); // Stop loading
      setTimeout(() => {
        setShowPopup(false); // Hide the popup after 3 seconds
      }, 3000);
    }
  }, [searchParams, navigate]);

  return (
    <div className="verify-container">
      <h2 className="neon-heading">Email Verification</h2>
      {isLoading && (
        <p className="loading-message">Verifying the token, please wait...</p>
      )}
      {showPopup && (
        <div
          className={`popup ${messageType === "success" ? "success" : "error"}`}
        >
          <p>{message}</p>
        </div>
      )}
    </div>
  );
};

export default VerifyEmail;
