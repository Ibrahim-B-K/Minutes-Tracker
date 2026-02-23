import React, { useEffect, useState, useRef } from "react";
import "./CollectorFilterBar.css";
import CollectorGenerateReports from "./CollectorGenerateReports";


function CollectorFilterBar({ activeTab, onFilterChange, issue_date }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterBy, setFilterBy] = useState("all"); // ✅ default All Issues
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDateField, setActiveDateField] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const fromDatePickerRef = useRef(null);
  const toDatePickerRef = useRef(null);
  const filterDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="collector-filter-bar">
      {/* Search */}
      <div className="collector-search-wrapper">
        <span className="collector-search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search issues..."
          value={searchQuery}
          onChange={(e) => handleFilterChange("search", e.target.value)}
        />
      </div>

      {/* From Date */}
      <div className="collector-date-input-wrapper">
        <input
          type="text"
          placeholder="From: (dd-mm-yyyy)"
          value={fromDate}
          onChange={(e) => handleFilterChange("fromDate", e.target.value)}
        />
        <span
          className="collector-calendar-icon"
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
      <div className="collector-date-input-wrapper">
        <input
          type="text"
          placeholder="To: (dd-mm-yyyy)"
          value={toDate}
          onChange={(e) => handleFilterChange("toDate", e.target.value)}
        />
        <span
          className="collector-calendar-icon"
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
      <div className="collector-filter-group collector-custom-filter">
        <label>Filter:</label>
        <div className={`collector-filter-dropdown ${filterOpen ? "open" : ""}`} ref={filterDropdownRef}>
          <button className="collector-filter-btn" onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false); }}>
            {filterLabel[filterBy]} ▾
          </button>

          <div className="collector-filter-menu">
            <div className="collector-filter-item">
              Priority ▸
              <div className="collector-sub-menu">
                <div onClick={() => { handleFilterChange("filterBy", "high"); setFilterOpen(false); }}>High</div>
                <div onClick={() => { handleFilterChange("filterBy", "medium"); setFilterOpen(false); }}>Medium</div>
                <div onClick={() => { handleFilterChange("filterBy", "low"); setFilterOpen(false); }}>Low</div>
              </div>
            </div>

            <div className="collector-filter-item">
              Department ▸
              <div className="collector-sub-menu">
                <div onClick={() => { handleFilterChange("filterBy", "health"); setFilterOpen(false); }}>Health</div>
                <div onClick={() => { handleFilterChange("filterBy", "education"); setFilterOpen(false); }}>Education</div>
                <div onClick={() => { handleFilterChange("filterBy", "works"); setFilterOpen(false); }}>Public Works</div>
              </div>
            </div>

            <div
              className="collector-filter-item"
              onClick={() => { handleFilterChange("filterBy", "all"); setFilterOpen(false); }}
            >
              All Issues
            </div>
          </div>
        </div>
      </div>

      {/* Sort */}
      <div className="collector-filter-group collector-custom-filter">
        <label>Sort:</label>
        <div className={`collector-filter-dropdown ${sortOpen ? "open" : ""}`} ref={sortDropdownRef}>
          <button className="collector-filter-btn" onClick={() => { setSortOpen(!sortOpen); setFilterOpen(false); }}>
            {sortBy === "priority"
              ? "Priority"
              : sortBy === "department"
                ? "Department"
                : "Deadline"} ▾
          </button>

          <div className="collector-filter-menu">
            <div
              className="collector-filter-item"
              onClick={() => { handleFilterChange("sortBy", "priority"); setSortOpen(false); }}
            >
              Priority
            </div>

            <div
              className="collector-filter-item"
              onClick={() => { handleFilterChange("sortBy", "department"); setSortOpen(false); }}
            >
              Department
            </div>

            <div
              className="collector-filter-item"
              onClick={() => { handleFilterChange("sortBy", "deadline"); setSortOpen(false); }}
            >
              Deadline
            </div>
          </div>
        </div>
      </div>


      {/* Generate */}
      {activeTab === "Received" && (
        <button className="collector-generate-btn" onClick={handleGenerate}>
          Generate Report
        </button>
      )}

      <CollectorGenerateReports
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}

export default CollectorFilterBar;
