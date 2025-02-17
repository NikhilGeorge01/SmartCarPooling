import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      axios
        .get(`http://localhost:5000/api/auth/verify-email?token=${token}`)
        .then((response) => {
          setMessage("Email verified successfully!");
        })
        .catch((error) => {
          setMessage(
            "Email verification failed. The token may be invalid or expired."
          );
        });
    } else {
      setMessage("No verification token provided.");
    }
  }, [searchParams]);

  return (
    <div>
      <h2>Email Verification</h2>
      <p>{message}</p>
    </div>
  );
};

export default VerifyEmail;
