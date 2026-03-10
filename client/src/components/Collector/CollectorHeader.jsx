import React, { useState, useRef, useEffect } from "react";
import "./CollectorHeader.css";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DescriptionIcon from "@mui/icons-material/Description";
import NotificationsIcon from "@mui/icons-material/Notifications";
import BarChartIcon from "@mui/icons-material/BarChart";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
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
    const LAST_SEEN_KEY = "collector_notifications_last_seen_at";

    const markSeen = () => {
      localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
      setHasNewNotifications(false);
    };

    const checkNotifications = async () => {
      if (location.pathname === "/collector/notifications") {
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
    <header className="collector-header">
      <div className="collector-logo">
        <img src="/logo.png" className="collector-logo-img" alt="Logo" />
        <span>Minutes Tracker System</span>
      </div>

      <div className="collector-header-icons" ref={dropdownRef}>
        <NavLink
          end
          to="/collector"
          className={({ isActive }) =>
            `collector-nav-link ${isActive ? "collector-active" : ""}`
          }
        >
          <span className="collector-nav-item">
            <HomeRoundedIcon className="collector-icon collector-home" />
            <span className="collector-nav-text">Home</span>
          </span>
        </NavLink>

        <NavLink
          to="/collector/minutes"
          className={({ isActive }) =>
            `collector-nav-link ${isActive ? "collector-active" : ""}`
          }
        >
          <span className="collector-nav-item">
            <DescriptionIcon className="collector-icon collector-minutes" />
            <span className="collector-nav-text">Minutes</span>
          </span>
        </NavLink>

        <NavLink
          to="/collector/analytics"
          className={({ isActive }) =>
            `collector-nav-link ${isActive ? "collector-active" : ""}`
          }
        >
          <span className="collector-nav-item">
            <BarChartIcon className="collector-icon collector-analytics" />
            <span className="collector-nav-text">Analytics</span>
          </span>
        </NavLink>

        <NavLink
          to="/collector/notifications"
          className={({ isActive }) =>
            `collector-nav-link ${isActive ? "collector-active" : ""}`
          }
        >
          <span className="collector-nav-item">
            <span className="collector-bell-wrap">
              <NotificationsIcon className="collector-icon collector-bell" />
              {hasNewNotifications && <span className="collector-notification-dot" />}
            </span>
            <span className="collector-nav-text">Notifications</span>
          </span>
        </NavLink>

        <div className="collector-nav-link" onClick={() => setOpen((prev) => !prev)}>
          <span className="collector-nav-item">
            <AccountCircleIcon className="collector-icon collector-profile" />
            <span className="collector-nav-text">Profile</span>
          </span>
        </div>

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

