import React from "react";
import { useParams } from "react-router-dom";

const Chat = () => {
  const { rideId } = useParams();

  return (
    <div>
      <h2>Chat Ready</h2>
      <p>You and the ride offerer are ready to chat for ride ID: {rideId}</p>
    </div>
  );
};

export default Chat;
