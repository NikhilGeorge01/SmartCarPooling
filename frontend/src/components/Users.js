import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Users.css";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const userResponse = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserId(userResponse.data._id);

        const response = await axios.get("http://localhost:5000/api/chat/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const filteredUsers = response.data.filter((user) => user._id !== userResponse.data._id);
        setUsers(filteredUsers);
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
      <h2>Users</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      <ul className="users-list">
        {users.map((user) => (
          <li key={user._id} className="user-item">
            <div className="user-info">
              <img src={user.photo || "/default-avatar.png"} alt={user.name} className="user-photo" />
              <div>
                <p className="user-name">{user.name}</p>
                <p className="user-email">{user.email}</p>
              </div>
            </div>
            <button className="chat-button" onClick={() => navigate(`/chat/${user._id}`)}>
              Chat
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Users;
