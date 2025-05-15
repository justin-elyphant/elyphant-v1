
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Updated: Added purple styling to Sign Up button for brand consistency
const AuthButtons = () => {
  return (
    <>
      <Button variant="ghost" size="sm" asChild>
        <Link to="/signin">Sign In</Link>
      </Button>
      <Button
        size="sm"
        asChild
        className="bg-purple-600 hover:bg-purple-700 text-white border-0"
      >
        <Link to="/signup">Sign Up</Link>
      </Button>
    </>
  );
};

export default AuthButtons;

