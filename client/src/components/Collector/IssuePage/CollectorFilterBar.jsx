import React, { useEffect, useState, useRef } from "react";
import "./CollectorFilterBar.css";
import CollectorGenerateReports from "./CollectorGenerateReports";
import CustomDateRangePicker from "../../common/CustomDateRangePicker";
import { format, parse } from "date-fns";

function CollectorFilterBar({ activeTab, onFilterChange, issue_date }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const datePickerRef = useRef(null);

  const handleGenerate = () => {
    setShowReportModal(true);
  };

  useEffect(() => {
    if (issue_date?.fromDate) setFromDate(issue_date.fromDate);
    if (issue_date?.toDate) setToDate(issue_date.toDate);
  }, [issue_date]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const emitFilters = (next) => {
    onFilterChange({
      fromDate: next.fromDate,
      toDate: next.toDate,
      filterBy: next.filterBy,
      sortBy: next.sortBy,
      searchQuery: next.searchQuery,
    });
  };

  const handleFilterChange = (type, value) => {
    let next = { fromDate, toDate, filterBy, sortBy, searchQuery };

    if (type === "filterBy") {
      next = { ...next, filterBy: value };
      setFilterBy(value);
    }

    if (type === "sortBy") {
      next = { ...next, sortBy: value };
      setSortBy(value);
    }

    if (type === "search") {
      next = { ...next, searchQuery: value };
      setSearchQuery(value);
    }

    emitFilters(next);
  };

  const handleDateRangeChange = (range) => {
    const formattedFrom = format(range.startDate, "dd-MM-yyyy");
    const formattedTo = format(range.endDate, "dd-MM-yyyy");
    
    setFromDate(formattedFrom);
    setToDate(formattedTo);
    
    const next = {
      fromDate: formattedFrom,
      toDate: formattedTo,
      filterBy,
      sortBy,
      searchQuery,
    };
    emitFilters(next);
  };

  const parseDateString = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date();
  };

  const hasAdvancedFilters = fromDate || toDate || filterBy !== "all" || sortBy !== "newest";

  const clearAdvancedFilters = () => {
    const next = {
      fromDate: "",
      toDate: "",
      filterBy: "all",
      sortBy: "newest",
      searchQuery,
    };
    setFromDate(next.fromDate);
    setToDate(next.toDate);
    setFilterBy(next.filterBy);
    setSortBy(next.sortBy);
    emitFilters(next);
  };

  return (
    <div className="collector-filter-toolbar">
      <div className="collector-filter-toolbar-main">
        <div className="collector-search-wrapper">
          <span className="collector-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search issues, issue no, minutes or department..."
            value={searchQuery}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>

        <div className="collector-toolbar-actions">
          <button
            className={`collector-toolbar-btn ${showAdvancedFilters ? "active" : ""}`}
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
          >
            Filters {hasAdvancedFilters ? "•" : ""}
          </button>

          {activeTab === "Received" && (
            <button className="collector-generate-btn" onClick={handleGenerate}>
              Generate Report
            </button>
          )}
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="collector-advanced-filters-panel">
          <div className="collector-advanced-grid">
            <div className="collector-filter-field" ref={datePickerRef} style={{ position: 'relative' }}>
              <label>Date Range</label>
              <div 
                className="collector-date-input-wrapper" 
                onClick={() => setShowDatePicker(!showDatePicker)}
                style={{ cursor: 'pointer' }}
              >
                <input
                  type="text"
                  placeholder="Select date range"
                  value={fromDate && toDate ? `${fromDate} to ${toDate}` : ""}
                  readOnly
                  style={{ cursor: 'pointer' }}
                />
                <span className="collector-calendar-icon">📅</span>
              </div>
              {showDatePicker && (
                <CustomDateRangePicker
                  initialStartDate={fromDate ? parseDateString(fromDate) : new Date()}
                  initialEndDate={toDate ? parseDateString(toDate) : new Date()}
                  onChange={handleDateRangeChange}
                  onClose={() => setShowDatePicker(false)}
                />
              )}
            </div>

            <div className="collector-filter-field">
              <label>Filter By</label>
              <select
                className="collector-filter-select"
                value={filterBy}
                onChange={(e) => handleFilterChange("filterBy", e.target.value)}
              >
                <option value="all">All Issues</option>
                <option value="high">Priority: High</option>
                <option value="medium">Priority: Medium</option>
                <option value="low">Priority: Low</option>
                <option value="health">Department: Health</option>
                <option value="education">Department: Education</option>
                <option value="works">Department: Public Works</option>
              </select>
            </div>

            <div className="collector-filter-field">
              <label>Sort</label>
              <select
                className="collector-filter-select"
                value={sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="deadline">Deadline</option>
                <option value="priority">Priority</option>
                <option value="department">Department</option>
              </select>
            </div>
          </div>

          <div className="collector-advanced-actions">
            <button className="collector-clear-filters-btn" onClick={clearAdvancedFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <CollectorGenerateReports
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}

export default CollectorFilterBar;
