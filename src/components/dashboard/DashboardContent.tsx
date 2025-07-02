
import React from "react";
import DashboardGrid from "./DashboardGrid";

const DashboardContent = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Your personalized gift-giving command center
        </p>
      </div>
      
      <DashboardGrid />
    </div>
  );
};

export default DashboardContent;
