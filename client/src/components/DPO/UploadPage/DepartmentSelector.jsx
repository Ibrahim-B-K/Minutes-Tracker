import React, { useState, useEffect, useRef } from "react";
import "./DepartmentSelector.css";
import CloseIcon from "@mui/icons-material/Close";
import api from "../../../api/axios";

export default function DepartmentSelector({ value = "", onChange }) {
  const [departments, setDepartments] = useState([]);
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const dropdownRef = useRef(null);

  // Parse the value (could be JSON array, string array, or comma-separated)
  useEffect(() => {
    if (Array.isArray(value)) {
      setSelectedDepts(value);
    } else if (typeof value === "string" && value.trim()) {
      // Try to parse as JSON array first
      try {
        if (value.trim().startsWith("[")) {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            setSelectedDepts(parsed);
            return;
          }
        }
      } catch (e) {
        // Not JSON, fall through to comma-separated parsing
      }
      
      // Fall back to comma-separated parsing (for backward compatibility)
      const depts = value
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
      setSelectedDepts(depts);
    } else {
      setSelectedDepts([]);
    }
  }, [value]);

  // Fetch departments from backend
  useEffect(() => {
    api
      .get("/departments")
      .then((res) => {
        const deptList = Array.isArray(res.data) ? res.data : [];
        setDepartments(deptList);
      })
      .catch((err) => console.error("Failed to load departments:", err));
  }, []);

  // Filter departments based on search
  const filteredDepts = departments.filter((dept) => {
    const searchLower = searchInput.toLowerCase();
    const isSelected = selectedDepts.includes(dept.dept_name);
    return (
      !isSelected &&
      (dept.dept_name.toLowerCase().includes(searchLower) ||
        dept.designation.toLowerCase().includes(searchLower))
    );
  });

  // Handle adding a department
  const handleAddDept = (deptName) => {
    const updated = [...selectedDepts, deptName];
    setSelectedDepts(updated);
    // Use JSON encoding to safely handle department names with commas
    onChange(JSON.stringify(updated));
    setSearchInput("");
    setDropdownOpen(false);
  };

  // Handle removing a department
  const handleRemoveDept = (deptName) => {
    const updated = selectedDepts.filter((d) => d !== deptName);
    setSelectedDepts(updated);
    // Use JSON encoding to safely handle department names with commas
    onChange(JSON.stringify(updated));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  return (
    <div className="dept-selector-container" ref={dropdownRef}>
      <div className="dept-selector-input-wrapper">
        <div className="dept-tags-area">
          {selectedDepts.map((dept) => (
            <div key={dept} className="dept-tag">
              <span className="dept-tag-label">{dept}</span>
              <button
                className="dept-tag-remove"
                onClick={() => handleRemoveDept(dept)}
                title="Remove department"
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>
          ))}

          <input
            type="text"
            className="dept-selector-input"
            placeholder={selectedDepts.length === 0 ? "Select departments..." : ""}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => setDropdownOpen(true)}
          />
        </div>
      </div>

      {dropdownOpen && (
        <div className="dept-dropdown">
          {filteredDepts.length === 0 && (
            <div className="dept-dropdown-empty">
              {searchInput.trim()
                ? "No departments found"
                : "All departments selected"}
            </div>
          )}
          {filteredDepts.map((dept) => (
            <button
              key={dept.id}
              className="dept-dropdown-item"
              onClick={() => handleAddDept(dept.dept_name)}
            >
              <div className="dept-dropdown-name">{dept.dept_name}</div>
              <div className="dept-dropdown-designation">{dept.designation}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
