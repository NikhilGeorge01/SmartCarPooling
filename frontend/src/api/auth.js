import axios from "axios";

// Base URL for backend API

const API_URL = "http://localhost:5000/api/auth"; // Adjust if your backend is running on a different port

// Register user

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);

    return response.data; // Return response data (success message)
  } catch (error) {
    throw error.response.data; // Return error message
  }
};

// Login user

export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);

    return response.data; // Return the JWT token
  } catch (error) {
    throw error.response.data; // Return error message
  }
};
