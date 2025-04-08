import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./Chat.css";

const Chat = () => {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/chat/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
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
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
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
    <div className="chat-container">
      <h2 className="neon-heading">Chat</h2>
      {error && <p className="error-message">{error}</p>}
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message-card ${msg.sender === userId ? "received" : "sent"}`}
          >
            <p>
              <strong>{msg.sender === userId ? "Them" : "You"}:</strong> {msg.message}
            </p>
          </div>
        ))}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message"
          className="message-input"
        />
        <button onClick={sendMessage} className="send-button">
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
