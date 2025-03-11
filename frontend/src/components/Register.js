import "./Register.css";
import React, { useState, useRef } from "react";
import axios from "axios";
import Webcam from "react-webcam";
import { Modal, Button } from "react-bootstrap";

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
  const [show, setShow] = useState(false);
  const webcamRef = useRef(null);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

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
    <>
      <Button variant="primary" onClick={handleShow} className="register-button">
        Register
      </Button>

      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Register</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <p className="text-danger">{error}</p>}
          {confirmationMessage && (
            <p className="text-success">{confirmationMessage}</p>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Gender:</label>
              <select
                className="form-control"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date of Birth:</label>
              <input
                type="date"
                className="form-control"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Aadhar/Identity:</label>
              <input
                type="text"
                className="form-control"
                value={aadhar}
                onChange={(e) => setAadhar(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Phone Number:</label>
              <input
                type="text"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Photo:</label>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={320}
                height={240}
              />
              <Button variant="secondary" onClick={capturePhoto} block>
                Capture Photo
              </Button>
              {photo && <img src={photo} alt="Captured" className="img-fluid mt-2" />}
            </div>
            <Button variant="primary" type="submit" disabled={loading} block>
              {loading ? "Registering..." : "Register"}
            </Button>
          </form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Register;