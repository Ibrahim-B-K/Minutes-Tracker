import React, { useState, useRef, useEffect } from "react";
import "./CollectorHeader.css";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import { Link, useNavigate } from "react-router-dom";
import DescriptionIcon from "@mui/icons-material/Description";

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
    <header className="collector-header">
      <div className="collector-logo">
        <div className="collector-logo-icon"></div>
        <span>Minutes Tracker System</span>
      </div>

<div className="collector-header-icons" ref={dropdownRef}>
  {/* Minutes Page */}
  <Link to="/collector/minutes">
    <DescriptionIcon className="collector-icon minutes" />
  </Link>

  {/* Notifications */}
  <Link to="/dpo/notifications">
    <NotificationsIcon className="collector-icon bell" />
  </Link>

  {/* Profile */}
  <div
    className="collector-icon profile"
    onClick={() => setOpen((prev) => !prev)}
  >
    C
  </div>

  {/* Dropdown */}
  {open && (
    <div className="collector-profile-dropdown">
      <button onClick={handleLogout} className="collector-logout-btn">
        <LogoutIcon className="collector-logout-icon" />
        Logout
      </button>
    </div>
  )}
</div>

    </header>
  );
}

export default Header;
