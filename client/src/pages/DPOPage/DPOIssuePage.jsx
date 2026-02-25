import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import DriveFolderUploadSharpIcon from "@mui/icons-material/DriveFolderUploadSharp";

// Components
import DPOHeader from "../../components/DPO/DPOHeader";
import DPOTabs from "../../components/DPO/IssuePage/DPOTabs";
import DPOFilterBar from "../../components/DPO/IssuePage/DPOFilterBar";
import DPOIssueCard from "../../components/DPO/IssuePage/DPOIssueCard";
import DPOIssueLifecycleDrawer from "../../components/DPO/IssuePage/DPOIssueLifecycleDrawer";
import DPOSingleIssueAssignCard from "../../components/DPO/IssuePage/DPOSingleIssueAssignCard";
import EmptyStateCard from "../../components/common/EmptyStateCard";
import LoadingState from "../../components/common/LoadingState";
import { LIVE_EVENT_ISSUES_UPDATED, addLiveEventListener } from "../../utils/liveUpdates";

// CSS
import "./DPOIssuePage.css";

// API
import api from "../../api/axios";

function DPOIssuePage() {
  const [activeTab, setActiveTab] = useState("Pending");
  const [filters, setFilters] = useState({});
  const [defaultDateRange, setDefaultDateRange] = useState(null);
  const [didInitDateRange, setDidInitDateRange] = useState(false);
  const [allIssues, setAllIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState(""); // For "sending..." or success message
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [logIssue, setLogIssue] = useState(null);
  const [isLifecycleOpen, setIsLifecycleOpen] = useState(false);

  const fetchIssues = async () => {
    if (allIssues.length === 0) setLoading(true);
    setError("");
    try {
      const params = filters.date ? { date: filters.date } : {};
      const res = await api.get("/issues", { params });
      setAllIssues(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching DPO issues:", err);
      setError("Failed to refresh issues. Retrying automatically...");
    } finally {
      setLoading(false);
    }
  };

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

  // ===== FETCH =====
  useEffect(() => {
    fetchIssues();
  }, [filters.date]);

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

  useEffect(() => {
    const onIssuesUpdated = () => {
      fetchIssues();
    };
    const unsubscribe = addLiveEventListener(LIVE_EVENT_ISSUES_UPDATED, onIssuesUpdated);
    return unsubscribe;
  }, [filters.date, allIssues.length]);

  // ===== FILTER =====
  const displayedIssues = useMemo(() => {
    const filtered = allIssues.filter((issue) => {
      const status = issue.status?.toLowerCase() || "pending";
      const tab = activeTab.toLowerCase();

      if (
        tab === "received"
          ? !["submitted", "completed"].includes(status)
          : status !== tab
      )
        return false;

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        if (
          !issue.issue?.toLowerCase().includes(q) &&
          !issue.issue_no?.toString().includes(q) &&
          !issue.department?.toLowerCase().includes(q) &&
          !issue.minutes_title?.toLowerCase().includes(q)
        )
          return false;
      }

      if (filters.filterBy && filters.filterBy !== "all") {
        const f = filters.filterBy.toLowerCase();
        if (["high", "medium", "low"].includes(f)) {
          if (issue.priority?.toLowerCase() !== f) return false;
        } else if (!issue.department?.toLowerCase().includes(f)) return false;
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

  const handleAllocateIssue = (issue) => {
    console.log("Allocating issue:", issue);

    api.post("/issues/allocate", issue)
      .then(() => {
        alert("Issue allocated successfully");
        setShowAssignModal(false);
      })
      .catch(() => {
        alert("Backend not ready");
      });
  };
  const handleResolve = (issueId, newStatus) => {
    setAllIssues((prev) =>
      prev.map((iss) =>
        iss.id === issueId ? { ...iss, resolution_status: newStatus } : iss
      )
    );
  };

  const handleOpenLifecycle = (issue) => {
    setLogIssue(issue);
    setIsLifecycleOpen(true);
  };

  const handleCloseLifecycle = () => {
    setIsLifecycleOpen(false);
  };

  const handleSendOverdueEmails = () => {
    setEmailLoading(true);
    setEmailStatus("Performing overdue email checks and sending..");

    api.post("/send-overdue-alerts")
      .then((res) => {
        if (res.data.sent_count > 0) {
          setEmailStatus(`All ${res.data.sent_count} Emails sent successfully`);
        } else {
          setEmailStatus("Nothing overdue");
        }
        // Auto-refresh issues to reflect status changes if any
        api.get("/issues").then(r => setAllIssues(r.data));
      })
      .catch((err) => {
        console.error(err);
        setEmailStatus("Error sending emails");
      })
      .finally(() => {
        // Clear status after some time
        setTimeout(() => {
          setEmailLoading(false);
          setEmailStatus("");
        }, 3000);
      });
  };

  return (
    <div className="dpo-container">
      <DPOHeader />
      
      <div className="dpo-content">

        <DPOFilterBar
          activeTab={activeTab}
          onFilterChange={(nf) => setFilters((p) => ({ ...p, ...nf }))}
          issue_date={defaultDateRange}
          handleSendOverdueEmails={handleSendOverdueEmails}
          emailLoading={emailLoading}
          emailStatus={emailStatus}
          onAddIssue={() => setShowAssignModal(true)}
        />

        {/* ✅ Tabs wrapper (DO NOT TOUCH DPOTabs) */}
        <div className="dpo-tabs-wrapper">
          <DPOTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        <div className="dpo-tab-scroll-area">
          {loading && allIssues.length === 0 ? (
            <LoadingState text="Loading issues..." />
          ) : error && allIssues.length === 0 ? (
            <EmptyStateCard
              title="Unable to load issues"
              description={error}
            />
          ) : displayedIssues.length === 0 ? (
            <EmptyStateCard
              title="No issues found"
              description={`There are no ${activeTab.toLowerCase()} issues to display.`}
            />
          ) : (
            displayedIssues.map((issue) => (
              <DPOIssueCard
                key={issue.id}
                issue={issue}
                onResolve={handleResolve}
                onOpenLog={handleOpenLifecycle}
              />
            ))
          )}
        </div>
      </div>

      <DPOIssueLifecycleDrawer
        isOpen={isLifecycleOpen}
        onClose={handleCloseLifecycle}
        selectedIssue={logIssue}
      />

      {/* ===== MODAL ===== */}
      {showAssignModal && (
        <div className="dpo-assign-overlay">
          <div
            className="dpo-assign-backdrop"
            onClick={() => setShowAssignModal(false)}
          />

          <div className="dpo-assign-modal">
            <div className="dpo-assign-header">
              <h2>Add New Issue</h2>
              <button
                className="dpo-close-btn"
                onClick={() => setShowAssignModal(false)}
              >
                ✕
              </button>
            </div>

            <DPOSingleIssueAssignCard
              issue={{
                issue_no: "NEW",
                issue: "",
                issue_description: "",
                department: "",
                priority: "Medium",
                location: "",
                deadline: "",
              }}
              index={0}
              onChange={() => { }}
              onAllocate={handleAllocateIssue}
            />

          </div>
        </div>
      )}
    </div>
  );
}

export default DPOIssuePage;
