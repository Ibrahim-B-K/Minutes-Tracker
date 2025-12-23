import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../../components/Collector/Header";
import Tabs from "../../components/Collector/IssuePage/Tabs";
import FilterBar from "../../components/Collector/IssuePage/FilterBar";
import IssueCard from "../../components/Collector/IssuePage/IssueCard";
import "./CollectorIssuePage.css";

function CollectorIssuePage() {
  const [activeTab, setActiveTab] = useState("Pending");
  const [filters, setFilters] = useState({});
  const [issues, setIssues] = useState([]);
  const [isSearching, setIsSearching] = useState(false); // NEW
  const [loading, setLoading] = useState(false);

  const lastIssueDate =
    issues.length > 0 ? issues[issues.length - 1].assigned_date : "";

  // Fetch issues from backend
  useEffect(() => {
    setLoading(true); // start

    const params = {
      status: filters.searchQuery ? "" : activeTab.toLowerCase(),
      search: filters.searchQuery || "",
      date: filters.date || "",
      filterBy: filters.filterBy || "all",
      sortBy: filters.sortBy || "newest",
    };

    axios
      .get("http://localhost:5000/issues", { params })
      .then((res) => {
        const data = res.data;
        setIssues(data);

        if (isSearching && data.length > 0) {
          const status = data[0].status;
          const newTab = status.charAt(0).toUpperCase() + status.slice(1);
          if (newTab !== activeTab) setActiveTab(newTab);
        }
      })
      .catch((err) => console.error("Error fetching issues:", err))
      .finally(() => setLoading(false)); // end
  }, [activeTab, filters, isSearching]);

  return (
    <div className="dpo-container">
      <Header />

      <div className="content">
        <div className="page-title">
          <h1>Issue Tracking & Management</h1>
        </div>

        {/* When filter changes, enable searching mode */}
        <FilterBar
          activeTab={activeTab}
          onFilterChange={(newFilters) => {
            setFilters(newFilters);
            setIsSearching(!!newFilters.searchQuery);
          }}
          issue_date={lastIssueDate}
        />

        {/* Manual tab change should turn off searching mode */}
        <Tabs
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsSearching(false);
          }}
        />

        <div className="tab-scroll-area">
          {loading ? (
            <p className="loading-text">Loading...</p>
          ) : issues.length === 0 ? (
            <p className="no-issues">No issues found</p>
          ) : (
            issues
              .filter(
                (issue) =>
                  issue.status.toLowerCase() === activeTab.toLowerCase()
              )
              .map((issue) => <IssueCard key={issue.issue_no} issue={issue} />)
          )}
        </div>
      </div>
    </div>
  );
}

export default CollectorIssuePage;
