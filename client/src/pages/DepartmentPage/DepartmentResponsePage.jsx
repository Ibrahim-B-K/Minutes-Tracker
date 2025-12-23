import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Header from "../../components/Department/Header";
import Tabs from "../../components/Department/Tabs";
import IssueCard from "../../components/Department/IssueCard";
import "./DepartmentResponsePage.css";

function DepartmentResponsePage() {
  const { dept } = useParams();
  const [activeTab, setActiveTab] = useState("Pending");
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dept) return;
    setLoading(true);
    // Fetch issues specifically for this department from Django
    axios.get(`http://127.0.0.1:8000/issues/${dept}`)
      .then((res) => {
        setIssues(res.data);
      })
      .catch((err) => console.error("Error fetching department issues:", err))
      .finally(() => setLoading(false));
  }, [dept, activeTab]); // Added activeTab to dependency to ensure fresh state if needed

  return (
    <div className="dpo-container">
      <Header departmentName={dept} />
      <div className="content">
        <h1>{dept?.toUpperCase()} Department Portal</h1>
        
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="tab-scroll-area">
          {loading ? (
            <p>Loading...</p>
          ) : issues.length === 0 ? (
            <p className="no-issues">No issues found for this department.</p>
          ) : (
            /* FIX: Logic to filter by tab and map statuses correctly */
            issues
              .filter((i) => {
                const status = i.status.toLowerCase();
                const tab = activeTab.toLowerCase();
                
                // Matches 'pending' -> 'Pending', 'overdue' -> 'Overdue', 'submitted' -> 'Submitted'
                return status === tab;
              })
              .map((issue) => (
                <IssueCard 
                  key={issue.id || issue.issue_dept_id} 
                  issue={issue} 
                />
              ))
          )}

          {/* Helper message if the specific tab is empty */}
          {!loading && issues.length > 0 && issues.filter(i => i.status.toLowerCase() === activeTab.toLowerCase()).length === 0 && (
            <p className="no-issues">No issues currently in {activeTab}.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DepartmentResponsePage;