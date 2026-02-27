import React from "react";
import "./DepartmentTabs.css";

function DepartmentTabs({ activeTab, setActiveTab }) {
  const tabs = ["Pending", "Overdue", "Submitted"];

  return (
    <div className="department-tabs-container">
      <div className="department-tabs">
        {tabs.map((tab) => (
          <div
            key={tab}
            className={`department-tab ${activeTab === tab ? "department-active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DepartmentTabs;
