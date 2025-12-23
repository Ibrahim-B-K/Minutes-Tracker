import React from "react";
import "./Stepper.css";

export default function Stepper({ step }) {
  return (
    <div className="stepper-container">
      <div className="step">
        <div className={`circle ${step >= 1 ? "active" : ""}`}>1</div>
        <span className={`label ${step >= 1 ? "active" : ""}`}>
          Upload minutes
        </span>
      </div>

      <div className={`line ${step >= 2 ? "active" : ""}`}></div>

      <div className="step">
        <div className={`circle ${step >= 2 ? "active" : ""}`}>2</div>
        <span className={`label ${step >= 2 ? "active" : ""}`}>
          Assign issues
        </span>
      </div>
    </div>
  );
}
