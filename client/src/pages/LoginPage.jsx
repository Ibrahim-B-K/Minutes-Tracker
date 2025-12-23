import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("http://127.0.0.1:8000/login", {
        username,
        password,
      });

      if (res.data.success) {
        const { role, department } = res.data;
        
        // --- ADD THESE TWO LINES ---
        localStorage.setItem("username", username);
        localStorage.setItem("role", role);
        // ---------------------------

        if (role === "dpo") navigate("/dpo");
        else if (role === "collector") navigate("/collector");
        else if (role === "dept") navigate(`/department/${department}`);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      // Demo Fallback
      localStorage.setItem("username", username);
      if (username === "dpo") navigate("/dpo");
      else navigate(`/department/${username}`);
    }
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2 className="login-title">Login</h2>
        {error && <div className="error-box">{error}</div>}
        <div className="input-field">
          <label>Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" />
        </div>
        <div className="input-field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
        </div>
        <button className="login-btn">Login</button>
      </form>
    </div>
  );
}