import React from "react";
import "./Header.css";
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Link } from "react-router-dom";
function Header() {
  return (
    <header className="header">
      <div className="logo">
        {/* Placeholder for logo icon */}
        <div className="logo-icon"></div>
        <span>DISTRICT DEVELOPMENT COUNCIL MINUTES MANAGEMENT SYSTEM</span>
      </div>

      <div className="header-icons">
        {/* Notification Bell Placeholder */}
        <Link to="/collector/notifications">
        <NotificationsIcon className="icon bell" />
        </Link>
        {/* Profile Circle Placeholder */}
        <div className="icon profile">C</div>
      </div>
    </header>
  );
}

export default Header;

