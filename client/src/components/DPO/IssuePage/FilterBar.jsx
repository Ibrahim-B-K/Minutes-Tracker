import React, { useEffect, useState, useRef } from "react";
import "./FilterBar.css";
import GenerateReports from "./GenerateReports";

function FilterBar({ activeTab, onFilterChange, issue_date }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [date, setDate] = useState([]);
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const datePickerRef = useRef(null);

  const handleGenerate = () => {
    setShowReportModal(true);
  };

  // When parent updates issue_date, update local date state
  useEffect(() => {
    if (issue_date) {
      setDate(issue_date);
    }
  }, [issue_date]);

  const handleFilterChange = (type, value) => {
    let updatedFilters = {
      date,
      filterBy,
      sortBy,
      searchQuery
    };

    if (type === "date") {
      updatedFilters.date = formatDateInput(value);
      setDate(updatedFilters.date);
    } else if (type === "filterBy") {
      updatedFilters.filterBy = value;
      setFilterBy(value);
    } else if (type === "sortBy") {
      updatedFilters.sortBy = value;
      setSortBy(value);
    } else if (type === "search") {
      updatedFilters.searchQuery = value;
      setSearchQuery(value);
    }

    onFilterChange(updatedFilters);
  };

  const handleDatePick = (e) => {
    const parts = e.target.value.split("-");
    if (parts.length === 3) {
      const formatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
      setDate(formatted);
      handleFilterChange("date", formatted);
    }
  };

  const formatDateInput = (raw) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
  };

  const handleDateChange = (e) => {
    const formatted = formatDateInput(e.target.value);
    setDate(formatted);
    handleFilterChange("date", formatted);
  };

  return (
    <div className="filter-bar">
      <div className="search-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search issues..."
          value={searchQuery}
          onChange={(e) => handleFilterChange("search", e.target.value)}
        />
      </div>

      <div className="date-input-wrapper">
        <input
          type="text"
          placeholder="dd-mm-yyyy"
          value={date}
          onChange={handleDateChange}
        />
        <span
          className="calendar-icon"
          onClick={() => datePickerRef.current.showPicker()}
        >
          📅
        </span>

        {/* hidden actual date picker */}
        <input
          type="date"
          ref={datePickerRef}
          onChange={handleDatePick}
          style={{ visibility: "hidden", position: "absolute" }}
        />
      </div>

      <div className="filter-group">
        <label>Filter By:</label>
        <select
          value={filterBy}
          onChange={(e) => handleFilterChange("filterBy", e.target.value)}
          className="filter-select"
        >
          <option value="all">All Issues</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
          <option value="health">Health Dept</option>
          <option value="education">Education Dept</option>
          <option value="works">Public Works</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Sort By:</label>
        <select
          value={sortBy}
          onChange={(e) => handleFilterChange("sortBy", e.target.value)}
          className="filter-select"
        >
          <option value="priority">Priority</option>
          <option value="department">Department</option>
          <option value="deadline">Deadline</option>
        </select>
      </div>

      {activeTab === "Received" && (
        <button className="generate-btn" onClick={handleGenerate}>
          Generate Report
        </button>
      )}

      <GenerateReports
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}

export default FilterBar;
