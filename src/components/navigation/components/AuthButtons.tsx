
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AuthButtons = () => {
  return (
    <div className="flex items-center gap-3">
      <Button 
        variant="ghost" 
        size="sm" 
        asChild
        className="text-gray-600 hover:text-gray-900 font-medium"
      >
        <Link to="/signin">Sign In</Link>
      </Button>
      <Button
        size="sm"
        asChild
        className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
      >
        <Link to="/signup">Get Started</Link>
      </Button>
    </div>
  );
};

export default AuthButtons;
