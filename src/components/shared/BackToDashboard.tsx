
import React from "react";
import StandardBackButton from "./StandardBackButton";

const BackToDashboard = () => {
  return (
    <div className="flex justify-start">
      <StandardBackButton 
        to="/dashboard" 
        text="Back to Dashboard" 
      />
    </div>
  );
};

export default BackToDashboard;
