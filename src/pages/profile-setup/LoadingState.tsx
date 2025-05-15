
import React from "react";

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message = "Setting up your profile..." }) => {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen p-4 bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
      <span className="text-lg font-medium text-center">{message}</span>
    </div>
  );
};

export default LoadingState;
