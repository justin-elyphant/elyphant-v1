
import React from "react";
import HomeContent from "@/components/home/HomeContent";

const Index = () => {
  console.log("Index page is rendering");
  
  try {
    return <HomeContent />;
  } catch (error) {
    console.error("Error in Index component:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
          <p className="text-gray-600">Please wait while we load the application.</p>
        </div>
      </div>
    );
  }
};

export default Index;
