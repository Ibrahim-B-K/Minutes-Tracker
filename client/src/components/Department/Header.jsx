import React, { useState, useRef, useEffect } from "react";
import "./Header.css";
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
    <header className="header">
      <div className="logo">
        <div className="logo-icon"></div>
        <span>Minutes Tracker System</span>
      </div>

      <div className="header-icons" ref={dropdownRef}>
        {/* Notifications */}
        <Link to="/department/notifications">
          <NotificationsIcon className="icon bell" />
        </Link>

        {/* Profile */}
        <div
          className="icon profile"
          onClick={() => setOpen((prev) => !prev)}
        >
          D
        </div>

        {/* Dropdown */}
        {open && (
          <div className="profile-dropdown">
            <button onClick={handleLogout} className="logout-btn">
              <LogoutIcon className="logout-icon" />
                Logout
            </button>

          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
