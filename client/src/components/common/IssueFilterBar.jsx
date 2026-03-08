import React, { useEffect, useState, useRef } from "react";
import "./IssueFilterBar.css";
import DPOGenerateReports from "../DPO/IssuePage/DPOGenerateReports";
import CustomDateRangePicker from "./CustomDateRangePicker";
import { format } from "date-fns";

/**
 * Unified Filter Bar for all roles (DPO, Collector, Department)
 * 
 * Props:
 * - activeTab: current visible tab
 * - onFilterChange: callback when any filter changes
 * - issue_date: initial date range
 * - handleSendOverdueEmails: action for overdue emails (DPO only)
 * - emailLoading: loading state for email action
 * - emailStatus: status message for email action
 * - onAddIssue: action to add new issue (DPO only)
 * - displayedIssues: list of issues currently visible (for reports)
 * - role: 'dpo', 'collector', or 'department'
 */
function IssueFilterBar({
  activeTab,
  onFilterChange,
  issue_date,
  handleSendOverdueEmails,
  emailLoading,
  emailStatus,
  onAddIssue,
  displayedIssues,
  role = "dpo",
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

  const isDPO = role === "dpo";

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
    <div className="common-filter-toolbar">
      <div className="common-filter-toolbar-main">
        <div className="common-search-wrapper">
          <span className="common-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search issues, issue no, minutes or department..."
            value={searchQuery}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>

        <div className="common-toolbar-actions">
          <button
            className={`common-toolbar-btn ${showAdvancedFilters ? "active" : ""}`}
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
          >
            Filters {hasAdvancedFilters ? "•" : ""}
          </button>

          {isDPO && activeTab === "Received" && (
            <button className="common-generate-btn" onClick={handleGenerate}>
              Generate Report
            </button>
          )}

          {isDPO && activeTab === "Overdue" && (
            <div className="common-overdue-action-wrap">
              <button
                className={`common-send-email-btn ${emailLoading ? "common-loading" : ""}`}
                onClick={handleSendOverdueEmails}
                disabled={emailLoading}
              >
                {emailLoading ? "Sending..." : "Send Overdue Emails"}
              </button>
              {emailStatus && <div className="common-email-status-popup">{emailStatus}</div>}
            </div>
          )}
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="common-advanced-filters-panel">
          <div className="common-advanced-grid">
            <div className="common-filter-field" ref={datePickerRef} style={{ position: 'relative' }}>
              <label>Date Range</label>
              <div 
                className="common-date-input-wrapper" 
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
                <span className="common-calendar-icon">📅</span>
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

            <div className="common-filter-field">
              <label>Filter By</label>
              <select
                className="common-filter-select"
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

            <div className="common-filter-field">
              <label>Sort</label>
              <select
                className="common-filter-select"
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

          <div className="common-advanced-actions">
            <button className="common-clear-filters-btn" onClick={clearAdvancedFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {isDPO && (
        <DPOGenerateReports
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          issues={displayedIssues}
        />
      )}
    </div>
  );
}

export default IssueFilterBar;
