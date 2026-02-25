import React, { useEffect, useState, useRef } from "react";
import "./CollectorFilterBar.css";
import CollectorGenerateReports from "./CollectorGenerateReports";


function CollectorFilterBar({ activeTab, onFilterChange, issue_date }) {
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
            <div className="collector-filter-field">
              <label>From Date</label>
              <div className="collector-date-input-wrapper">
                <input
                  type="text"
                  placeholder="dd-mm-yyyy"
                  value={fromDate}
                  onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                />
                <span
                  className="collector-calendar-icon"
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

            <div className="collector-filter-field">
              <label>To Date</label>
              <div className="collector-date-input-wrapper">
                <input
                  type="text"
                  placeholder="dd-mm-yyyy"
                  value={toDate}
                  onChange={(e) => handleFilterChange("toDate", e.target.value)}
                />
                <span
                  className="collector-calendar-icon"
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
