
// import axios from "axios";
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import DepartmentHeader from "../../components/Department/DepartmentHeader";
import DepartmentTabs from "../../components/Department/DepartmentTabs";
import DepartmentIssueCard from "../../components/Department/DepartmentIssueCard";
import "./DepartmentResponsePage.css";
import api from "../../api/axios";

function DepartmentResponsePage() {
  const { dept } = useParams();
  const [activeTab, setActiveTab] = useState("Pending");
  const [allIssues, setAllIssues] = useState([]); // Renamed for clarity
  const [loading, setLoading] = useState(false);

  // 1. OPTIMIZATION: Fetch ONLY when department changes, NOT when tab changes
  useEffect(() => {
    if (!dept) return;
    
    setLoading(true);
    // Fetch issues specifically for this department from Django
    api.get(`/issues/${dept}`)
      .then((res) => {
        setAllIssues(res.data);
      })
      .catch((err) => console.error("Error fetching department issues:", err))
      .finally(() => setLoading(false));
      
  }, [dept]); // <--- FIX: Removed activeTab from here!

  // 2. OPTIMIZATION: Filter instantly in memory using useMemo
  const displayedIssues = useMemo(() => {
    const tabLower = activeTab.toLowerCase();

    return allIssues.filter((i) => {
      const status = i.status.toLowerCase();
      
      // Handle the 'Submitted' vs 'Received' logic if needed
      if (tabLower === 'submitted') {
        return status === 'submitted' || status === 'completed';
      }
      return status === tabLower;
    });
  }, [allIssues, activeTab]); // Re-runs instantly when tab changes

  return (
    <div className="dpo-container">
      <DepartmentHeader departmentName={dept} />
      <div className="content">
        <h1>{dept?.toUpperCase()} Department Portal</h1>
        
        <DepartmentTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="tab-scroll-area">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              {displayedIssues.length > 0 ? (
                displayedIssues.map((issue) => (
                  <DepartmentIssueCard 
                    // We fixed the serializer to return 'id', so use that
                    key={issue.id} 
                    issue={issue} 
                  />
                ))
              ) : (
                <p className="no-issues">No issues currently in {activeTab}.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DepartmentResponsePage;