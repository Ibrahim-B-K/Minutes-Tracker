import React, { useEffect, useState, useRef } from "react";
import "./DPOFilterBar.css";
import DPOGenerateReports from "./DPOGenerateReports";

function DPOFilterBar({
  activeTab,
  onFilterChange,
  issue_date,
  handleSendOverdueEmails,
  emailLoading,
  emailStatus
}) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterBy, setFilterBy] = useState("all"); // ✅ default All Issues
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDateField, setActiveDateField] = useState(null);

  const fromDatePickerRef = useRef(null);
  const toDatePickerRef = useRef(null);

  const handleGenerate = () => {
    setShowReportModal(true);
  };

  // Sync dates from parent
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

  const handleFilterChange = (type, value) => {
    let updatedFilters = {
      fromDate,
      toDate,
      filterBy,
      sortBy,
      searchQuery
    };

    if (type === "fromDate") {
      const v = formatDateInput(value);
      setFromDate(v);
      updatedFilters.fromDate = v;
      const fromK = dateKey(v);
      const toK = dateKey(updatedFilters.toDate);
      if (fromK && toK && fromK > toK) {
        setToDate(v);
        updatedFilters.toDate = v;
      }
    } else if (type === "toDate") {
      const v = formatDateInput(value);
      setToDate(v);
      updatedFilters.toDate = v;
      const fromK = dateKey(updatedFilters.fromDate);
      const toK = dateKey(v);
      if (fromK && toK && toK < fromK) {
        setFromDate(v);
        updatedFilters.fromDate = v;
      }
    } else if (type === "filterBy") {
      setFilterBy(value);
      updatedFilters.filterBy = value;
    } else if (type === "sortBy") {
      setSortBy(value);
      updatedFilters.sortBy = value;
    } else if (type === "search") {
      setSearchQuery(value);
      updatedFilters.searchQuery = value;
    }

    onFilterChange(updatedFilters);
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

  const filterLabel = {
    all: "All Issues",
    high: "High Priority",
    medium: "Medium Priority",
    low: "Low Priority",
    health: "Health Dept",
    education: "Education Dept",
    works: "Public Works"
  };

  return (
    <div className="dpo-filter-bar">
      {/* Search */}
      <div className="dpo-search-wrapper">
        <span className="dpo-search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search issues..."
          value={searchQuery}
          onChange={(e) => handleFilterChange("search", e.target.value)}
        />
      </div>

      {/* From Date */}
      <div className="dpo-date-input-wrapper">
        <input
          type="text"
          placeholder="From: (dd-mm-yyyy)"
          value={fromDate}
          onChange={(e) => handleFilterChange("fromDate", e.target.value)}
        />
        <span
          className="dpo-calendar-icon"
          onClick={() => {
            setActiveDateField("from");
            fromDatePickerRef.current.showPicker();
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

      {/* To Date */}
      <div className="dpo-date-input-wrapper">
        <input
          type="text"
          placeholder="To: (dd-mm-yyyy)"
          value={toDate}
          onChange={(e) => handleFilterChange("toDate", e.target.value)}
        />
        <span
          className="dpo-calendar-icon"
          onClick={() => {
            setActiveDateField("to");
            toDatePickerRef.current.showPicker();
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

      {/* Filter (Nested) */}
      <div className="dpo-filter-group dpo-custom-filter">
        <label>Filter:</label>
        <div className="dpo-filter-dropdown">
          <button className="dpo-filter-btn">
            {filterLabel[filterBy]} ▾
          </button>

          <div className="dpo-filter-menu">
            <div className="dpo-filter-item">
              Priority ▸
              <div className="dpo-sub-menu">
                <div onClick={() => handleFilterChange("filterBy", "high")}>High</div>
                <div onClick={() => handleFilterChange("filterBy", "medium")}>Medium</div>
                <div onClick={() => handleFilterChange("filterBy", "low")}>Low</div>
              </div>
            </div>

            <div className="dpo-filter-item">
              Department ▸
              <div className="dpo-sub-menu">
                <div onClick={() => handleFilterChange("filterBy", "health")}>Health</div>
                <div onClick={() => handleFilterChange("filterBy", "education")}>Education</div>
                <div onClick={() => handleFilterChange("filterBy", "works")}>Public Works</div>
              </div>
            </div>

            <div
              className="dpo-filter-item"
              onClick={() => handleFilterChange("filterBy", "all")}
            >
              All Issues
            </div>
          </div>
        </div>
      </div>

      {/* Sort */}
      <div className="dpo-filter-group dpo-custom-filter">
        <label>Sort:</label>
        <div className="dpo-filter-dropdown">
          <button className="dpo-filter-btn">
            {sortBy === "priority"
              ? "Priority"
              : sortBy === "department"
                ? "Department"
                : "Deadline"} ▾
          </button>

          <div className="dpo-filter-menu">
            <div
              className="dpo-filter-item"
              onClick={() => handleFilterChange("sortBy", "priority")}
            >
              Priority
            </div>

            <div
              className="dpo-filter-item"
              onClick={() => handleFilterChange("sortBy", "department")}
            >
              Department
            </div>

            <div
              className="dpo-filter-item"
              onClick={() => handleFilterChange("sortBy", "deadline")}
            >
              Deadline
            </div>
          </div>
        </div>
      </div>


      {/* Generate */}
      {activeTab === "Received" && (
        <button className="dpo-generate-btn" onClick={handleGenerate}>
          Generate Report
        </button>
      )}
      {activeTab === "Overdue" && (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
          <button
            className={`dpo-send-email-btn ${emailLoading ? 'dpo-loading' : ''}`}
            onClick={handleSendOverdueEmails}
            disabled={emailLoading}
          >
            {emailLoading ? "Sending..." : "Send Overdue Emails"}
          </button>

          {emailStatus && (
            <div className="dpo-email-status-popup">
              {emailStatus}
            </div>
          )}
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
