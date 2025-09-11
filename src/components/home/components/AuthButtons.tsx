
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AuthButtons = () => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate("/auth?mode=signin");
  };

  const handleGetStarted = () => {
    navigate("/auth?mode=signup&redirect=/gifting");
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSignIn}
          className="text-gray-600 hover:text-gray-900 font-medium"
        >
          Sign In
        </Button>
        <Button
          size="sm"
          onClick={handleGetStarted}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
        >
          Get Started
        </Button>
      </div>
    </>
  );
};

export default AuthButtons;
