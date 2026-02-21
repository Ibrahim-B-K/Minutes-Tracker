import React from "react";
import "./DPOTabs.css";

function Tabs({ activeTab, setActiveTab }) {
  const tabs = ["Pending", "Overdue", "Received"];

  return (
    <div className="dpo-tabs-container">
      <div className="dpo-tabs">
        {tabs.map((tab) => (
          <div
            key={tab}
            className={`dpo-tab ${activeTab === tab ? "dpo-active" : ""}`}
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
