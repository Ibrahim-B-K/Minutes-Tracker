import React, { useEffect, useState, useRef } from "react";
import "./DPOFilterBar.css";
import DPOGenerateReports from "./DPOGenerateReports";

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
  const [activeDateField, setActiveDateField] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const fromDatePickerRef = useRef(null);
  const toDatePickerRef = useRef(null);

  const handleGenerate = () => {
    setShowReportModal(true);
  };

  useEffect(() => {
    if (issue_date?.fromDate) setFromDate(issue_date.fromDate);
    if (issue_date?.toDate) setToDate(issue_date.toDate);
  }, [issue_date]);

  const formatDateInput = (raw) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
  };

  const dateKey = (value) => {
    if (!value || typeof value !== "string") return null;
    const [dd, mm, yyyy] = value.split("-");
    if (!dd || !mm || !yyyy || dd.length < 2 || mm.length < 2 || yyyy.length < 4) return null;
    return Number(`${yyyy}${mm}${dd}`);
  };

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

    if (type === "fromDate") {
      const formatted = formatDateInput(value);
      const fromK = dateKey(formatted);
      const toK = dateKey(next.toDate);
      next = {
        ...next,
        fromDate: formatted,
        toDate: fromK && toK && fromK > toK ? formatted : next.toDate,
      };
      setFromDate(next.fromDate);
      setToDate(next.toDate);
    }

    if (type === "toDate") {
      const formatted = formatDateInput(value);
      const fromK = dateKey(next.fromDate);
      const toK = dateKey(formatted);
      next = {
        ...next,
        toDate: formatted,
        fromDate: fromK && toK && toK < fromK ? formatted : next.fromDate,
      };
      setFromDate(next.fromDate);
      setToDate(next.toDate);
    }

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

  const handleDatePick = (e) => {
    const parts = e.target.value.split("-");
    if (parts.length === 3) {
      const formatted = `${parts[2]}-${parts[1]}-${parts[0]}`;

      if (activeDateField === "from") {
        setFromDate(formatted);
        handleFilterChange("fromDate", formatted);
      } else if (activeDateField === "to") {
        setToDate(formatted);
        handleFilterChange("toDate", formatted);
      }
    }
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
            <div className="dpo-filter-field">
              <label>From Date</label>
              <div className="dpo-date-input-wrapper">
                <input
                  type="text"
                  placeholder="dd-mm-yyyy"
                  value={fromDate}
                  onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                />
                <span
                  className="dpo-calendar-icon"
                  onClick={() => {
                    setActiveDateField("from");
                    fromDatePickerRef.current?.showPicker?.();
                  }}
                >
                  📅
                </span>
                <input
                  type="date"
                  ref={fromDatePickerRef}
                  onChange={handleDatePick}
                  style={{ visibility: "hidden", position: "absolute" }}
                />
              </div>
            </div>

            <div className="dpo-filter-field">
              <label>To Date</label>
              <div className="dpo-date-input-wrapper">
                <input
                  type="text"
                  placeholder="dd-mm-yyyy"
                  value={toDate}
                  onChange={(e) => handleFilterChange("toDate", e.target.value)}
                />
                <span
                  className="dpo-calendar-icon"
                  onClick={() => {
                    setActiveDateField("to");
                    toDatePickerRef.current?.showPicker?.();
                  }}
                >
                  📅
                </span>
                <input
                  type="date"
                  ref={toDatePickerRef}
                  onChange={handleDatePick}
                  style={{ visibility: "hidden", position: "absolute" }}
                />
              </div>
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
