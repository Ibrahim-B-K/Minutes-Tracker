import React, { useState, useRef, useEffect } from "react";
import "./DPOHeader.css";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import BusinessIcon from "@mui/icons-material/Business";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DescriptionIcon from "@mui/icons-material/Description";
import DraftsIcon from '@mui/icons-material/Drafts';

import { NavLink, useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { clearAuthValues, getAuthValue } from "../../utils/authStorage";
import {
  LIVE_EVENT_NOTIFICATIONS_UPDATED,
  addLiveEventListener,
} from "../../utils/liveUpdates";

function Header() {
  const [open, setOpen] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [deptData, setDeptData] = useState({
    name: "",
    email: "",
    designation: "",
    password: "",
    confirmPassword: "",
  });

  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const LAST_SEEN_KEY = "dpo_notifications_last_seen_at";

    const markSeen = () => {
      localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
      setHasNewNotifications(false);
    };

    const checkNotifications = async () => {
      if (location.pathname === "/dpo/notifications") {
        markSeen();
        return;
      }
      try {
        const username = getAuthValue("username");
        const res = await api.get("/notifications", { params: { username } });
        const notifications = Array.isArray(res.data) ? res.data : [];
        if (notifications.length === 0) {
          setHasNewNotifications(false);
          return;
        }

        const latest = notifications[0];
        const latestTs = latest?.created_at ? new Date(latest.created_at).getTime() : 0;
        const seenTs = new Date(localStorage.getItem(LAST_SEEN_KEY) || 0).getTime();
        setHasNewNotifications(latestTs > seenTs);
      } catch (err) {
        console.error("Notification check error:", err);
      }
    };

    checkNotifications();
    const unsubscribe = addLiveEventListener(
      LIVE_EVENT_NOTIFICATIONS_UPDATED,
      checkNotifications
    );
    return unsubscribe;
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clearAuthValues();
      navigate("/login");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeptData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateDepartment = async () => {
    if (!deptData.name.trim() || !deptData.email.trim() || !deptData.designation.trim() || !deptData.password || !deptData.confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (deptData.password !== deptData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await api.post("/departments/create-user", {
        dept_name: deptData.name.trim(),
        email: deptData.email.trim(),
        designation: deptData.designation.trim(),
        password: deptData.password,
        confirm_password: deptData.confirmPassword,
      });

      const createdUsername = res?.data?.username;
      alert(createdUsername ? `Department user created. Username: ${createdUsername}` : "Department user created successfully");

      setShowDeptModal(false);
      setDeptData({
        name: "",
        email: "",
        designation: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      const message = err?.response?.data?.error || "Failed to create department user";
      alert(message);
    }
  };

  return (
    <>
      <header className="dpo-header">
        <div className="dpo-logo">
          <div className="dpo-logo-icon"></div>
          <span>Minutes Tracker System</span>
        </div>

        <div className="dpo-header-icons" ref={dropdownRef}>
          <NavLink
            end
            to="/dpo/home"
            className={({ isActive }) => `dpo-nav-link ${isActive ? "dpo-active" : ""}`}
          >
            <span className="dpo-nav-item">
              <HomeRoundedIcon className="dpo-icon dpo-home" />
              <span className="dpo-nav-text">Home</span>
            </span>
          </NavLink>

          <NavLink
            to="/dpo/drafts"
            className={({ isActive }) => `dpo-nav-link ${isActive ? "dpo-active" : ""}`}
          >
            <span className="dpo-nav-item">
              <DraftsIcon className="dpo-icon dpo-drafts" />
              <span className="dpo-nav-text">Drafts</span>
            </span>
          </NavLink>

          <NavLink
            to="/dpo/minutes"
            className={({ isActive }) => `dpo-nav-link ${isActive ? "dpo-active" : ""}`}
          >
            <span className="dpo-nav-item">
              <DescriptionIcon className="dpo-icon dpo-minutes" />
              <span className="dpo-nav-text">Minutes</span>
            </span>
          </NavLink>

          <NavLink
            to="/dpo/notifications"
            className={({ isActive }) => `dpo-nav-link ${isActive ? "dpo-active" : ""}`}
          >
            <span className="dpo-nav-item">
              <span className="dpo-bell-wrap">
                <NotificationsIcon className="dpo-icon dpo-bell" />
                {hasNewNotifications && <span className="dpo-notification-dot" />}
              </span>
              <span className="dpo-nav-text">Notifications</span>
            </span>
          </NavLink>
          <div className="dpo-icon dpo-profile" onClick={() => setOpen((prev) => !prev)}>
            D
          </div>

          {open && (
            <div className="dpo-profile-dropdown">
              <button
                className="dpo-logout-btn"
                onClick={() => {
                  setOpen(false);
                  setShowDeptModal(true);
                }}
              >
                <BusinessIcon className="dpo-adddept-icon" />
                Add User
              </button>

              <button onClick={handleLogout} className="dpo-logout-btn">
                <LogoutIcon className="dpo-logout-icon" />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {showDeptModal && (
        <div className="dpo-modal-overlay">
          <div className="dpo-modal">
            <h3>Add Department</h3>

            <input
              type="text"
              name="name"
              placeholder="Department Name"
              value={deptData.name}
              onChange={handleInputChange}
            />

            <input
              type="email"
              name="email"
              placeholder="Department Email"
              value={deptData.email}
              onChange={handleInputChange}
            />

            <input
              type="text"
              name="designation"
              placeholder="Designation"
              value={deptData.designation}
              onChange={handleInputChange}
            />

            <div className="dpo-password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create Password"
                value={deptData.password}
                onChange={handleInputChange}
              />
              <span className="dpo-eye-icon" onClick={() => setShowPassword((prev) => !prev)}>
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </span>
            </div>

            <div className="dpo-password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={deptData.confirmPassword}
                onChange={handleInputChange}
              />
              <span
                className="dpo-eye-icon"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </span>
            </div>

            <div className="dpo-modal-buttons">
              <button className="dpo-cancel-btn" onClick={() => setShowDeptModal(false)}>
                Cancel
              </button>

              <button className="dpo-save-btn" onClick={handleCreateDepartment}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
