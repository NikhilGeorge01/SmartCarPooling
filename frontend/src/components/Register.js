import "./Register.css";
import React, { useState, useRef } from "react";
import axios from "axios";
import Webcam from "react-webcam";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [aadhar, setAadhar] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const webcamRef = useRef(null);

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setPhoto(imageSrc);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (
      !name ||
      !email ||
      !password ||
      !gender ||
      !dob ||
      !aadhar ||
      !phone ||
      !photo
    ) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    axios
      .post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password,
        gender,
        dob,
        aadhar,
        phone,
        photo,
      })
      .then((response) => {
        console.log("Registered:", response);
        setConfirmationMessage(
          "Registered successfully! Please check your email to verify your account."
        );
        setName("");
        setEmail("");
        setPassword("");
        setGender("");
        setDob("");
        setAadhar("");
        setPhone("");
        setPhoto(null);
      })
      .catch((error) => {
        console.error("Registration error:", error);
        setError("Registration failed. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {confirmationMessage && (
        <p style={{ color: "green" }}>{confirmationMessage}</p>
      )}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
        <div>
          <label>Gender:</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label>Date of Birth:</label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>
        <div>
          <label>Aadhar/Identity:</label>
          <input
            type="text"
            value={aadhar}
            onChange={(e) => setAadhar(e.target.value)}
          />
        </div>
        <div>
          <label>Phone Number:</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <label>Photo:</label>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={320}
            height={240}
          />
          <button type="button" onClick={capturePhoto}>
            Capture Photo
          </button>
          {photo && <img src={photo} alt="Captured" />}
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
};

export default Register;