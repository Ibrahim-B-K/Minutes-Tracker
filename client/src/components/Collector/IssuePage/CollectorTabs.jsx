import React from "react";
import "./CollectorTabs.css";

function Tabs({ activeTab, setActiveTab }) {
  const tabs = ["Pending", "Overdue", "Received"];

  return (
    <div className="collector-tabs-container">
      <div className="collector-tabs">
        {tabs.map((tab) => (
          <div
            key={tab}
            className={`collector-tab ${activeTab === tab ? "collector-active" : ""}`}
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
