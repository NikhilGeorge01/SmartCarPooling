import React, { useState, useEffect } from "react";
import axios from "axios";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token"); // Get token from local storage
      const response = await axios.get("http://localhost:5000/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
      setName(response.data.name);
      setPhone(response.data.phone || "");
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  // Handle profile update
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      if (profilePic) formData.append("profilePic", profilePic);

      await axios.put("http://localhost:5000/api/user/profile/update", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      setMessage("Profile updated successfully!");
      fetchUserProfile(); // Refresh profile
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Failed to update profile.");
    }
  };

  return (
    <div>
      <h2>User Profile</h2>
      {user ? (
        <form onSubmit={handleUpdate}>
          <label>Name:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />

          <label>Phone:</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />

          <label>Profile Picture:</label>
          <input type="file" accept="image/*" onChange={(e) => setProfilePic(e.target.files[0])} />

          <button type="submit">Update Profile</button>
        </form>
      ) : (
        <p>Loading profile...</p>
      )}
      {message && <p>{message}</p>}
    </div>
  );
};

export default Profile;
