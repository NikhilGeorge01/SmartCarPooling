import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const Chat = () => {
  const { userId } = useParams(); // The ID of the user you're chatting with
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/chat/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setMessages(response.data);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Error fetching messages");
      }
    };

    fetchMessages();
  }, [userId]);

  const sendMessage = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/chat",
        { receiver: userId, message: newMessage },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setMessages([...messages, response.data]);
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Error sending message");
    }
  };

  return (
    <div>
      <h2>Chat</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div>
        {messages.map((msg, index) => (
          <p key={index}>
            <strong>{msg.sender === userId ? "Them" : "You"}:</strong>{" "}
            {msg.message}
          </p>
        ))}
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
