import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Users.css"; // Import the CSS file

const Users = () => {
  const [users, setUsers] = useState([]); // Users in the canChatWith field
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        // Fetch logged-in user's details, including the populated canChatWith field
        const userResponse = await axios.get(
          "http://localhost:5000/api/auth/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Set the users from the canChatWith field
        setUsers(userResponse.data.canChatWith || []);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Error fetching users");
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  return (
    <div className="users-container">
      <h2>Users You Can Chat With</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      <ul className="users-list">
        {users.map((user) => (
          <li key={user._id} className="user-item">
            <div className="user-info">
              <img
                src={user.photo || "/default-avatar.png"}
                alt={user.name}
                className="user-photo"
              />
              <div>
                <p className="user-name">{user.name}</p>
                <p className="user-email">{user.email}</p>
                <p className="user-gender">Gender: {user.gender}</p>
                <p className="user-dob">
                  DOB: {new Date(user.dob).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              className="chat-button"
              onClick={() => navigate(`/chat/${user._id}`)}
            >
              Chat
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Users;
