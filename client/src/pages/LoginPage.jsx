// import React, { useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import "./LoginPage.css";

// export default function Login() {
//   const navigate = useNavigate();
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     try {
//       const res = await axios.post(
//         "http://127.0.0.1:8000/login",
//         { username, password },
//         { withCredentials: true }   // ⭐ VERY IMPORTANT
//       );
      

//       if (!res.data.success) {
//         setError("Login failed");
//         return;
//       }

//       const { role, department } = res.data;

//       // Store minimal info (optional but useful)
//       localStorage.setItem("username", username);
//       localStorage.setItem("role", role);

//       // ---- ROLE BASED REDIRECT ----
//       if (role === "dpo") {
//         navigate("/dpo");
//       } 
//       else if (role === "collector") {
//         navigate("/collector");
//       } 
//       else if (role === "department") {
//         navigate(`/department/${department}`);
//       }
//       else if(username==="openbox") {
//         navigate(`http://127.0.0.1:8000/admin`)
//       }
//       else {
//         setError("Unknown user role");
//       }

//     } catch (err) {
//       console.error(err);
//       setError("Invalid username or password");
//     }
//   };

//   return (
//     <div className="login-container">
//       <form className="login-card" onSubmit={handleSubmit}>
//         <h2 className="login-title">Login</h2>

//         {error && <div className="error-box">{error}</div>}

//         <div className="input-field">
//           <label>Username</label>
//           <input
//             type="text"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             placeholder="Enter username"
//             required
//           />
//         </div>

//         <div className="input-field">
//           <label>Password</label>
//           <input
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             placeholder="Enter password"
//             required
//           />
//         </div>

//         <button className="login-btn" type="submit">
//           Login
//         </button>
//       </form>
//     </div>
//   );
// }


// Updated Code Below- BY KEERTHI- TRYING TO FIX LOGIN ISSUE USING TOKEN AUTHENTICATION

import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

// Backend base URL
// const API_BASE_URL = "http://localhost:8000";

export default function Login() {
  const navigate = useNavigate();

  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 🔴 IMPORTANT:
      // Use plain axios for login (NOT api instance)
      // api instance adds token interceptor, but we don't have a token yet
      const response = await axios.post(
        "http://127.0.0.1:8000/login",
        {
          username: username.trim(),
          password: password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.data.success) {
        setError("Login failed");
        return;
      }

      const { token, role, department, username: loggedUser } = response.data;

      // ✅ Store token for future API calls
      localStorage.setItem("token", token);
      localStorage.setItem("username", loggedUser);
      localStorage.setItem("role", role);

      if (department) {
        localStorage.setItem("department", department);
      }

      // ✅ Role-based navigation (REQUIRED) 
      if (role === "dpo") {
        navigate("/dpo");
      } else if (role === "collector") {
        navigate("/collector");
      } else if (role === "department") {
        navigate(`/department/${department}`);
      } else {
        setError("Unknown user role");
      }

    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* left branding panel (3 parts) */}
      <div className="login-left">
        <div className="branding">
          <h1>Minutes Tracker</h1>
          <p>Efficiently manage meeting minutes</p>
        </div>
      </div>
      {/* right panel (1 part) with login form */}
      <div className="login-right">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2 className="login-title">Login</h2>

        {error && <div className="error-box">{error}</div>}

        <div className="input-field">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="input-field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      
      </div> 
    </div> 
  );
}
