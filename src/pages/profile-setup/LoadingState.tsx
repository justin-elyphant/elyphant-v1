
import React from "react";

const LoadingState = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
      <span className="text-lg font-medium">Setting up your profile...</span>
    </div>
  );
};

export default LoadingState;
