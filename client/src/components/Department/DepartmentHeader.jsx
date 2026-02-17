import React, { useState, useRef, useEffect } from "react";
import "./DepartmentHeader.css";
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
    <header className="dept-header">
      <div className="dept-logo">
        <div className="dept-logo-icon"></div>
        <span>Minutes Tracker System</span>
      </div>

      <div className="dept-header-icons" ref={dropdownRef}>
        {/* Minutes */}
        <Link to={`/department/${localStorage.getItem("department")}/minutes`} title="View Minutes">
          <span className="dept-icon minutes">📄</span>
        </Link>

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
