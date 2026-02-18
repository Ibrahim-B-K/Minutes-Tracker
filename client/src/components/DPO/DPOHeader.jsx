import React, { useState, useRef, useEffect } from "react";
import "./DPOHeader.css";
import HomeIcon from "@mui/icons-material/Home";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import BusinessIcon from "@mui/icons-material/Business";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DescriptionIcon from "@mui/icons-material/Description";
import DriveFolderUploadSharpIcon from "@mui/icons-material/DriveFolderUploadSharp";

import { NavLink, useNavigate } from "react-router-dom";
import api from "../../api/axios";

function Header() {

  /* =========================
     ===== STATE SECTION =====
  ========================== */

  const [open, setOpen] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [deptData, setDeptData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  /* =========================
     ===== EFFECT SECTION =====
  ========================== */

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* =========================
     ===== HANDLERS =====
  ========================== */

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.clear();
      navigate("/login");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeptData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateDepartment = () => {
    if (deptData.password !== deptData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    console.log("Department Data:", deptData);

    // Backend integration here
    // api.post("/departments", deptData)

    setShowDeptModal(false);
    setDeptData({
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    });
  };

  /* =========================
     ===== JSX SECTION =====
  ========================== */

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="dpo-header">
        <div className="dpo-logo">
          <div className="dpo-logo-icon"></div>
          <span>Minutes Tracker System</span>
        </div>

        <div className="dpo-header-icons" ref={dropdownRef}>
          <NavLink to="/dpo/home" className="dpo-nav-link">
  <HomeIcon className="dpo-icon home" />
</NavLink>

<NavLink to="/dpo/upload" className="dpo-nav-link">
  <DriveFolderUploadSharpIcon className="dpo-icon upload" />
</NavLink>

<NavLink to="/dpo/minutes" className="dpo-nav-link">
  <DescriptionIcon className="dpo-icon minutes" />
</NavLink>

<NavLink to="/dpo/notifications" className="dpo-nav-link">
  <NotificationsIcon className="dpo-icon bell" />
</NavLink>
          <div
            className="dpo-icon profile"
            onClick={() => setOpen((prev) => !prev)}
          >
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

              <button
                onClick={handleLogout}
                className="dpo-logout-btn"
              >
                <LogoutIcon className="dpo-logout-icon" />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ================= ADD DEPT MODAL ================= */}
      {showDeptModal && (
        <div className="dept-modal-overlay">
          <div className="dept-modal">
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

            {/* Password */}
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create Password"
                value={deptData.password}
                onChange={handleInputChange}
              />
              <span
                className="eye-icon"
                onClick={() => setShowPassword(prev => !prev)}
              >
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </span>
            </div>

            {/* Confirm Password */}
            <div className="password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={deptData.confirmPassword}
                onChange={handleInputChange}
              />
              <span
                className="eye-icon"
                onClick={() => setShowConfirmPassword(prev => !prev)}
              >
                {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </span>
            </div>

            <div className="dept-modal-buttons">
              <button
                className="cancel-btn"
                onClick={() => setShowDeptModal(false)}
              >
                Cancel
              </button>

              <button
                className="save-btn"
                onClick={handleCreateDepartment}
              >
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