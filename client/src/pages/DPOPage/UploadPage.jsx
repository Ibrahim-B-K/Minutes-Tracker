// src/pages/UploadPage.jsx
import React, { useState } from "react";
import Header from "../../components/DPO/Header";
import Stepper from "../../components/DPO/UploadPage/Stepper";
import UploadForm from "../../components/DPO/UploadPage/UploadForm";
import AssignIssues from "../../components/DPO/UploadPage/AssignIssues";
import "./UploadPage.css";

function UploadPage() {
  const [step, setStep] = useState(1);

  const handleProcessComplete = () => {
    setStep(2); // just go to next step
  };

  return (
    <div className="uploadpage-container">
      <Header />

      <div className="uploadpage-content">
        <Stepper step={step} />

        {step === 1 && (
          <div className="upload-card">
            <UploadForm onProcessed={handleProcessComplete} />
          </div>
        )}

        {step === 2 && (
          <div className="assign-card">
            <AssignIssues /> {/* issues not needed */}
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadPage;
