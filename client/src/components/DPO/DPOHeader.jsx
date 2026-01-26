import React, { useState, useRef, useEffect } from "react";
import "./DPOHeader.css";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";

import { Link } from "react-router-dom";

function Header() {
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
