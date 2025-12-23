import React from "react";
import "./Tabs.css";

function Tabs({ activeTab, setActiveTab }) {
  const tabs = ["Pending", "Overdue", "Received"];

  return (
    <div className="tabs-container">
      <div className="tabs">
        {tabs.map((tab) => (
          <div
            key={tab}
            className={`tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tabs;
