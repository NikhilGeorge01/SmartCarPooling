import React, { useState, useRef } from "react";
import axios from "axios";
import Webcam from "react-webcam";
import "./Register.css";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [twitterUsername, setTwitterUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState(null);
  const [cibil, setCibil] = useState("");
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

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (
      !name ||
      !email ||
      !password ||
      !gender ||
      !dob ||
      !twitterUsername ||
      !phone ||
      !photo ||
      !cibil
    ) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (!passwordRegex.test(password)) {
      setError(
        "Password must be at least 8 characters long and include an uppercase letter, a number, and a special character."
      );
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
        twitterUsername,
        phone,
        photo,
        cibil,
      })
      .then(() => {
        setConfirmationMessage(
          "Registered successfully! Please check your email to verify your account."
        );
        setName("");
        setEmail("");
        setPassword("");
        setGender("");
        setDob("");
        setTwitterUsername("");
        setPhone("");
        setPhoto(null);
        setCibil("");
      })
      .catch(() => {
        setError("Registration failed. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="register-container">
      <h2 className="neon-text animate__animated animate__fadeInDown">
        Register
      </h2>
      {error && <p className="error-message">{error}</p>}
      {confirmationMessage && (
        <p className="success-message">{confirmationMessage}</p>
      )}
      <form onSubmit={handleSubmit} className="register-form scrollable-form">
        <div className="input-field">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="input-field">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-field">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="input-field">
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="input-field">
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
          />
        </div>
        <div className="input-field">
          <input
            type="text"
            placeholder="Twitter Username"
            value={twitterUsername}
            onChange={(e) => setTwitterUsername(e.target.value)}
            required
          />
        </div>
        <div className="input-field">
          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <div className="input-field">
          <input
            type="number"
            placeholder="CIBIL Score" // Added CIBIL score input field
            value={cibil}
            onChange={(e) => setCibil(e.target.value)}
            required
          />
        </div>
        <div className="webcam-section">
          <Webcam
            className="webcam"
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
          />
          <button
            type="button"
            className="capture-button"
            onClick={capturePhoto}
          >
            Capture Photo
          </button>
          {photo && <img src={photo} alt="Captured" className="captured-img" />}
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
};

export default Register;
