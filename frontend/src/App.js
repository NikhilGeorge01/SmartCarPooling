import React, { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";

const App = () => {
    const [token, setToken] = useState(null); // Store JWT token

    return (
        <div>
            <h1>Carpool App</h1>
            {!token ? (
                <div>
                    <Login setToken={setToken} />
                    <Register setToken={setToken} />
                </div>
            ) : (
                <div>
                    <h2>Welcome, you are logged in!</h2>
                    <button onClick={() => setToken(null)}>Logout</button>
                </div>
            )}
        </div>
    );
};

export default App;
