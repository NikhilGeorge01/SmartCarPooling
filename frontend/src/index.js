import React from "react";
import ReactDOM from "react-dom/client"; // use 'react-dom/client' for React 18
import App from "./App";

// Global styling wrapper: Apply common theme settings

// Create a root container and inject the App component
const root = ReactDOM.createRoot(document.getElementById("root"));

// Render the App component inside the root element with a smooth modern theme
root.render(<App />);
