import React, { useState, useRef, useEffect } from "react";
import "./DepartmentHeader.css";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DescriptionIcon from "@mui/icons-material/Description";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { clearAuthValues, getAuthValue } from "../../utils/authStorage";
import {
  LIVE_EVENT_NOTIFICATIONS_UPDATED,
  addLiveEventListener,
} from "../../utils/liveUpdates";

function Header() {
  const [open, setOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dept = getAuthValue("department");

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
    const LAST_SEEN_KEY = "department_notifications_last_seen_at";

    const markSeen = () => {
      localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
      setHasNewNotifications(false);
    };

    const checkNotifications = async () => {
      if (location.pathname === "/department/notifications") {
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

  return (
    <header className="department-header">
      <div className="department-logo">
        <div className="department-logo-icon"></div>
        <span>Minutes Tracker System</span>
      </div>

      <div className="department-header-icons" ref={dropdownRef}>
        <NavLink
          end
          to={`/department/${dept}`}
          className={({ isActive }) =>
            `department-nav-link ${isActive ? "department-active" : ""}`
          }
        >
          <span className="department-nav-item">
            <HomeRoundedIcon className="department-icon department-home" />
            <span className="department-nav-text">Home</span>
          </span>
        </NavLink>

        <NavLink
          to={`/department/${dept}/minutes`}
          className={({ isActive }) =>
            `department-nav-link ${isActive ? "department-active" : ""}`
          }
        >
          <span className="department-nav-item">
            <DescriptionIcon className="department-icon department-minutes" />
            <span className="department-nav-text">Minutes</span>
          </span>
        </NavLink>

        <NavLink
          to="/department/notifications"
          className={({ isActive }) =>
            `department-nav-link ${isActive ? "department-active" : ""}`
          }
        >
          <span className="department-nav-item">
            <span className="department-bell-wrap">
              <NotificationsIcon className="department-icon department-bell" />
              {hasNewNotifications && <span className="department-notification-dot" />}
            </span>
            <span className="department-nav-text">Notifications</span>
          </span>
        </NavLink>

        <div
          className="department-icon department-profile"
          onClick={() => setOpen((prev) => !prev)}
        >
          D
        </div>

        {open && (
          <div className="department-profile-dropdown">
            <button onClick={handleLogout} className="department-logout-btn">
              <LogoutIcon className="department-logout-icon" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;

