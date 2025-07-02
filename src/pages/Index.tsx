
import React from "react";
import HomeContent from "@/components/home/HomeContent";

const Index = () => {
  console.log("Index page component starting to render");
  
  try {
    console.log("Index page attempting to render HomeContent");
    return <HomeContent />;
  } catch (error) {
    console.error("Critical error in Index component:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Page Error</h1>
          <p className="text-gray-600">Unable to load the home page.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }
};

export default Index;
