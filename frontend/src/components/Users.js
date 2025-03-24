import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null); // Store logged-in user's ID
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Fetch logged-in user's details
        const userResponse = await axios.get(
          "http://localhost:5000/api/auth/me",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setUserId(userResponse.data._id);

        // Fetch all verified users
        const response = await axios.get(
          "http://localhost:5000/api/chat/users",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        // Exclude the logged-in user from the list
        const filteredUsers = response.data.filter(
          (user) => user._id !== userResponse.data._id
        );
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
    <div>
      <h2>Users</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {users.map((user) => (
          <li key={user._id}>
            <p>Name: {user.name}</p>
            <p>Email: {user.email}</p>
            {user.photo ? (
              <img
                src={user.photo}
                alt={`${user.name}'s photo`}
                style={{ width: "50px", height: "50px", borderRadius: "50%" }}
              />
            ) : (
              <p>No Photo</p>
            )}
            <button onClick={() => navigate(`/chat/${user._id}`)}>Chat</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Users;
