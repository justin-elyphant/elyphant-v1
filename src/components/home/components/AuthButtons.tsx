
import React from "react";
import { Link } from "react-router-dom";
import { LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const AuthButtons = () => {
  return (
    <nav className="flex items-center space-x-3">
      <Button variant="outline" size="sm" asChild>
        <Link to="/sign-in">
          <LogIn className="mr-2 h-4 w-4" />
          Login
        </Link>
      </Button>
      <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
        <Link to="/sign-up">
          <User className="mr-2 h-4 w-4" />
          Sign Up
        </Link>
      </Button>
    </nav>
  );
};

export default AuthButtons;
