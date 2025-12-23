import React, { useState, useEffect, useRef } from "react";
import "./FilterBar.css";

function FilterBar({ activeTab, onFilterChange, issue_date }) {
  const [date, setDate] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");

  const datePickerRef = useRef(null);

  // Set initial date from parent
  useEffect(() => {
    if (issue_date) setDate(issue_date);
  }, [issue_date]);

  // Format dd-mm-yyyy manually
  const formatDateInput = (raw) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4)
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
  };

  // Helper to notify parent
  const updateFilters = (updated) => {
    onFilterChange({
      date,
      filterBy,
      sortBy,
      searchQuery,
      ...updated,
    });
  };

  const handleDateChange = (e) => {
    const formatted = formatDateInput(e.target.value);
    setDate(formatted);
    updateFilters({ date: formatted });
  };

  const handleDatePick = (e) => {
    const [yyyy, mm, dd] = e.target.value.split("-");
    if (dd && mm && yyyy) {
      const formatted = `${dd}-${mm}-${yyyy}`;
      setDate(formatted);
      updateFilters({ date: formatted });
    }
  };

  return (
    <div className="filter-bar">

      {/* Search Box */}
      <div className="search-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search issues..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            updateFilters({ searchQuery: e.target.value });
          }}
        />
      </div>

      {/* Date Input */}
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

        <input
          type="date"
          ref={datePickerRef}
          onChange={handleDatePick}
          style={{ visibility: "hidden", position: "absolute" }}
        />
      </div>

      {/* Filter By */}
      <div className="filter-group">
        <label>Filter By:</label>
        <select
          value={filterBy}
          onChange={(e) => {
            setFilterBy(e.target.value);
            updateFilters({ filterBy: e.target.value });
          }}
          className="filter-select"
        >
          <option value="all">All Issues</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>

      {/* Sort By */}
      <div className="filter-group">
        <label>Sort By:</label>
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            updateFilters({ sortBy: e.target.value });
          }}
          className="filter-select"
        >
          <option value="newest">Newest</option>
          <option value="priority">Priority</option>
          <option value="deadline">Deadline</option>
        </select>
      </div>

    </div>
  );
}

export default FilterBar;
