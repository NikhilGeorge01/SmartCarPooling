import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import "./VerifyEmail.css"; // Import the CSS file

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      axios
        .get(`http://localhost:5000/api/auth/verify-email?token=${token}`)
        .then((response) => {
          setMessage("Email verified successfully!");
          setMessageType("success");
        })
        .catch((error) => {
          setMessage("Email verification failed. The token may be invalid or expired.");
          setMessageType("error");
        });
    } else {
      setMessage("No verification token provided.");
      setMessageType("error");
    }
  }, [searchParams]);

  return (
    <div className="verify-container">
      <h2>Email Verification</h2>
      <p className={messageType === "success" ? "success-message" : "error-message"}>
        {message}
      </p>
    </div>
  );
};

export default VerifyEmail;
