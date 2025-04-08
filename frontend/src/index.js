import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Wrap in React.StrictMode for highlighting potential problems
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
