import React, { useState, useRef, useEffect } from "react";
import "./CollectorHeader.css";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";

import { Link } from "react-router-dom";

function CollectorHeader() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const handleLogout = () => {
    // clear auth data here
    console.log("Logged out");
  };

  return (
    <header className="collector-header">
      <div className="collector-logo">
        <div className="collector-logo-icon"></div>
        <span>Minutes Tracker System</span>
      </div>

      <div className="collector-header-icons" ref={dropdownRef}>
        {/* Notifications */}
        <Link to="/collector/notifications">
          <NotificationsIcon className="collector-icon bell" />
        </Link>

        {/* Profile */}
        <div
          className="collector-icon profile"
          onClick={() => setOpen((prev) => !prev)}
        >
          D
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

export default CollectorHeader;
