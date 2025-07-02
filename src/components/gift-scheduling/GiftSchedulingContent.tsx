
import React from "react";
import GiftSchedulingTabs from "./GiftSchedulingTabs";

const GiftSchedulingContent = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gift Scheduling</h1>
        <p className="text-gray-600 mt-2">
          Plan and schedule your gifts in advance
        </p>
      </div>
      
      <GiftSchedulingTabs />
    </div>
  );
};

export default GiftSchedulingContent;
