import React, { useEffect, useState, useRef } from "react";
import "./DPOFilterBar.css";
import DPOGenerateReports from "./DPOGenerateReports";
import CustomDateRangePicker from "../../common/CustomDateRangePicker";
import { format, parse } from "date-fns";

function DPOFilterBar({
  activeTab,
  onFilterChange,
  issue_date,
  handleSendOverdueEmails,
  emailLoading,
  emailStatus,
  onAddIssue,
}) {
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

  return (
    <div className="dpo-filter-toolbar">
      <div className="dpo-filter-toolbar-main">
        <div className="dpo-search-wrapper">
          <span className="dpo-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search issues, issue no, minutes or department..."
            value={searchQuery}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>

        <div className="dpo-toolbar-actions">
          <button
            className={`dpo-toolbar-btn ${showAdvancedFilters ? "active" : ""}`}
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
          >
            Filters {hasAdvancedFilters ? "•" : ""}
          </button>

          <button className="dpo-add-issue-btn" onClick={onAddIssue}>
            + Add Issue
          </button>

          {activeTab === "Received" && (
            <button className="dpo-generate-btn" onClick={handleGenerate}>
              Generate Report
            </button>
          )}

          {activeTab === "Overdue" && (
            <div className="dpo-overdue-action-wrap">
              <button
                className={`dpo-send-email-btn ${emailLoading ? "dpo-loading" : ""}`}
                onClick={handleSendOverdueEmails}
                disabled={emailLoading}
              >
                {emailLoading ? "Sending..." : "Send Overdue Emails"}
              </button>

              {emailStatus && <div className="dpo-email-status-popup">{emailStatus}</div>}
            </div>
          )}
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="dpo-advanced-filters-panel">
          <div className="dpo-advanced-grid">
            <div className="dpo-filter-field" ref={datePickerRef} style={{ position: 'relative' }}>
              <label>Date Range</label>
              <div 
                className="dpo-date-input-wrapper" 
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
                <span className="dpo-calendar-icon">📅</span>
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

            <div className="dpo-filter-field">
              <label>Filter By</label>
              <select
                className="dpo-filter-select"
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

            <div className="dpo-filter-field">
              <label>Sort</label>
              <select
                className="dpo-filter-select"
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

          <div className="dpo-advanced-actions">
            <button className="dpo-clear-filters-btn" onClick={clearAdvancedFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <DPOGenerateReports
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}

export default DPOFilterBar;
