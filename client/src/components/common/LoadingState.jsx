import React from "react";
import "./LoadingState.css";

function LoadingState({ text = "Loading...", compact = false, raised = true }) {
  return (
    <div
      className={`loading-state ${compact ? "loading-state-compact" : ""} ${raised ? "loading-state-raised" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="loading-orbit">
        <span className="loading-dot loading-dot-1"></span>
        <span className="loading-dot loading-dot-2"></span>
        <span className="loading-dot loading-dot-3"></span>
      </div>
      <p>{text}</p>
    </div>
  );
}

export default LoadingState;
