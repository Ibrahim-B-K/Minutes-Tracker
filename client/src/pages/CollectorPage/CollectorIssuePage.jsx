import React, { useEffect, useState, useMemo } from "react";
import CollectorHeader from "../../components/Collector/CollectorHeader";
import CollectorTabs from "../../components/Collector/IssuePage/CollectorTabs";
import CollectorFilterBar from "../../components/Collector/IssuePage/CollectorFilterBar";
import CollectorIssueCard from "../../components/Collector/IssuePage/CollectorIssueCard";
import EmptyStateCard from "../../components/common/EmptyStateCard";
import LoadingState from "../../components/common/LoadingState";
import "./CollectorIssuePage.css";
import api from "../../api/axios"; // Uses your configured axios with Token

function CollectorIssuePage() {
  const [activeTab, setActiveTab] = useState("Pending");
  const [filters, setFilters] = useState({});
  const [defaultDateRange, setDefaultDateRange] = useState(null);
  const [didInitDateRange, setDidInitDateRange] = useState(false);
  const [allIssues, setAllIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const dateKeyFromRaw = (raw) => {
    if (!raw || typeof raw !== "string") return null;

    const ymdMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) {
      return Number(`${ymdMatch[1]}${ymdMatch[2]}${ymdMatch[3]}`);
    }

    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return null;
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return Number(`${y}${m}${d}`);
  };

  const getIssueDateKeys = (issue) => {
    const keys = [dateKeyFromRaw(issue?.meeting_date || "")].filter(Boolean);
    return [...new Set(keys)];
  };

  const getIssueDateKey = (issue) => {
    const keys = getIssueDateKeys(issue);
    return keys.length > 0 ? Math.max(...keys) : null;
  };

  const toDDMMYYYY = (dt) => {
    const day = String(dt.getDate()).padStart(2, "0");
    const month = String(dt.getMonth() + 1).padStart(2, "0");
    const year = dt.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const parseDDMMYYYYToKey = (value) => {
    if (!value || typeof value !== "string") return null;
    const [dd, mm, yyyy] = value.split("-");
    if (!dd || !mm || !yyyy) return null;
    return Number(`${yyyy}${mm.padStart(2, "0")}${dd.padStart(2, "0")}`);
  };

  // 1. Fetch Logic: Get ALL issues once (or when Date filter changes)
  useEffect(() => {
    setLoading(true);

    // Use the specific date param if it exists, otherwise fetch all
    const params = filters.date ? { date: filters.date } : {};

    api.get("/issues", { params })
      .then((res) => {
        setAllIssues(res.data);
      })
      .catch((err) => console.error("Error fetching issues:", err))
      .finally(() => setLoading(false));

  }, [filters.date]); // Only re-fetch from server if the DATE filter changes

  useEffect(() => {
    if (didInitDateRange || allIssues.length === 0) return;
    const dated = allIssues
      .map((issue) => {
        const k = getIssueDateKey(issue);
        if (!k) return null;
        const s = String(k);
        return new Date(Number(s.slice(0, 4)), Number(s.slice(4, 6)) - 1, Number(s.slice(6, 8)));
      })
      .filter(Boolean)
      .sort((a, b) => b.getTime() - a.getTime());
    if (dated.length === 0) return;

    const latest = toDDMMYYYY(dated[0]);
    setDefaultDateRange({ fromDate: latest, toDate: latest });
    setFilters((prev) => ({ ...prev, fromDate: latest, toDate: latest }));
    setDidInitDateRange(true);
  }, [allIssues, didInitDateRange]);

  // 2. Instant Client-Side Filtering (Same logic as DPO page)
  const displayedIssues = useMemo(() => {
    const filtered = allIssues.filter((issue) => {

      // A. Filter by Tab
      const status = issue.status ? issue.status.toLowerCase() : "pending";
      const tab = activeTab.toLowerCase();

      let statusMatch = false;
      if (tab === "received") {
        // "Received" tab shows 'submitted' or 'completed' status
        statusMatch = (status === "submitted" || status === "completed");
      } else {
        statusMatch = (status === tab);
      }

      if (!statusMatch) return false;

      // B. Filter by Search Query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch =
          (issue.issue && issue.issue.toLowerCase().includes(query)) ||
          (issue.issue_no && issue.issue_no.toString().includes(query)) ||
          (issue.department && issue.department.toLowerCase().includes(query));

        if (!matchesSearch) return false;
      }

      // C. Filter by Dropdown (Priority/Dept)
      if (filters.filterBy && filters.filterBy !== "all") {
        const filterVal = filters.filterBy.toLowerCase();

        // Check Priority
        if (['high', 'medium', 'low'].includes(filterVal)) {
          if (issue.priority.toLowerCase() !== filterVal) return false;
        }
        // Check Department
        else {
          if (!issue.department.toLowerCase().includes(filterVal)) return false;
        }
      }

      const issueDateKeys = getIssueDateKeys(issue);
      const fromDateKeyRaw = parseDDMMYYYYToKey(filters.fromDate);
      const toDateKeyRaw = parseDDMMYYYYToKey(filters.toDate);
      const lowerBound =
        fromDateKeyRaw && toDateKeyRaw ? Math.min(fromDateKeyRaw, toDateKeyRaw) : fromDateKeyRaw;
      const upperBound =
        fromDateKeyRaw && toDateKeyRaw ? Math.max(fromDateKeyRaw, toDateKeyRaw) : toDateKeyRaw;
      if ((lowerBound || upperBound) && issueDateKeys.length === 0) return false;
      if (lowerBound || upperBound) {
        const inRange = issueDateKeys.some((key) => {
          if (lowerBound && key < lowerBound) return false;
          if (upperBound && key > upperBound) return false;
          return true;
        });
        if (!inRange) return false;
      }

      return true;
    });

    const parseDeadline = (value) => {
      if (!value || typeof value !== "string") return Number.MAX_SAFE_INTEGER;
      const [dd, mm, yyyy] = value.split("-");
      if (!dd || !mm || !yyyy) return Number.MAX_SAFE_INTEGER;
      return Number(`${yyyy}${mm}${dd}`);
    };

    const priorityRank = (value) => {
      const p = String(value || "").toLowerCase();
      if (p === "high") return 0;
      if (p === "medium") return 1;
      if (p === "low") return 2;
      return 3;
    };

    const sortBy = String(filters.sortBy || "newest").toLowerCase();
    const sorted = [...filtered];

    if (sortBy === "priority") {
      sorted.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
      return sorted;
    }

    if (sortBy === "department") {
      sorted.sort((a, b) => String(a.department || "").localeCompare(String(b.department || "")));
      return sorted;
    }

    if (sortBy === "deadline") {
      sorted.sort((a, b) => parseDeadline(a.deadline) - parseDeadline(b.deadline));
      return sorted;
    }

    sorted.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    return sorted;
  }, [allIssues, activeTab, filters]);

  return (
    <div className="collector-issuepage-container">
      <CollectorHeader />

      <div className="collector-issuepage-content">
        <div className="collector-page-title">
          <h1>District Monitor</h1>
        </div>

        <CollectorFilterBar
          activeTab={activeTab}
          onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
          issue_date={defaultDateRange}
        />

        <CollectorTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <div className="collector-tab-scroll-area">
          {loading ? (
            <LoadingState text="Loading issues..." />
          ) : displayedIssues.length === 0 ? (
            <EmptyStateCard
              title="No issues found"
              description={`There are no ${activeTab.toLowerCase()} issues to display.`}
            />
          ) : (
            displayedIssues.map((issue) => (
              <CollectorIssueCard key={issue.id} issue={issue} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default CollectorIssuePage;
