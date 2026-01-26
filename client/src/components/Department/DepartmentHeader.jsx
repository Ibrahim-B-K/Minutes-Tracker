import React, { useState, useRef, useEffect } from "react";
import "./DepartmentHeader.css";
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
    <header className="dept-header">
      <div className="dept-logo">
        <div className="dept-logo-icon"></div>
        <span>Minutes Tracker System</span>
      </div>

      <div className="dept-header-icons" ref={dropdownRef}>
        {/* Notifications */}
        <Link to="/department/notifications">
          <NotificationsIcon className="dept-icon bell" />
        </Link>

        {/* Profile */}
        <div
          className="dept-icon profile"
          onClick={() => setOpen((prev) => !prev)}
        >
          D
        </div>

        {/* Dropdown */}
        {open && (
          <div className="dept-profile-dropdown">
            <button onClick={handleLogout} className="dept-logout-btn">
              <LogoutIcon className="dept-logout-icon" />
                Logout
            </button>

          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
