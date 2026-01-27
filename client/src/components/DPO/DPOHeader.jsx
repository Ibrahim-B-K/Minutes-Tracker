import React, { useState, useRef, useEffect } from "react";
import "./DPOHeader.css";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";

function Header() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  /* Close dropdown when clicking outside */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint
      await api.post("/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Clear localStorage regardless of API response
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      localStorage.removeItem("department");
      // Redirect to login
      navigate("/login");
    }
  };

  return (
    <header className="dpo-header">
      <div className="dpo-logo">
        <div className="dpo-logo-icon"></div>
        <span>Minutes Tracker System</span>
      </div>

      <div className="dpo-header-icons" ref={dropdownRef}>
        {/* Notifications */}
        <Link to="/dpo/notifications">
          <NotificationsIcon className="dpo-icon bell" />
        </Link>

        {/* Profile */}
        <div
          className="dpo-icon profile"
          onClick={() => setOpen((prev) => !prev)}
        >
          D
        </div>

        {/* Dropdown */}
        {open && (
          <div className="dpo-profile-dropdown">
            <button onClick={handleLogout} className="dpo-logout-btn">
              <LogoutIcon className="dpo-logout-icon" />
                Logout
            </button>

          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
