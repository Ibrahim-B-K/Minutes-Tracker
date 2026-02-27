import React from "react";
import "./EmptyStateCard.css";

function EmptyStateCard({
  title = "No items found",
  description = "There is nothing to show right now.",
  compact = false,
}) {
  return (
    <div className={`empty-state-card ${compact ? "empty-state-compact" : ""}`}>
      <svg
        className="empty-state-illustration"
        viewBox="0 0 120 120"
        fill="none"
        aria-hidden="true"
      >
        <rect x="20" y="24" width="80" height="72" rx="10" className="empty-stroke" />
        <path d="M36 46H84" className="empty-stroke" />
        <path d="M36 58H72" className="empty-stroke" />
        <path d="M36 70H64" className="empty-stroke" />
        <circle cx="84" cy="82" r="10" className="empty-stroke" />
        <path d="M91 89L98 96" className="empty-stroke" />
      </svg>

      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default EmptyStateCard;
