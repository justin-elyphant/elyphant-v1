
import React from "react";
import { Link } from "react-router-dom";
import { LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface AuthButtonsProps {
  profileImage?: string | null;
}

const AuthButtons = (_props: AuthButtonsProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex items-center gap-3">
      {/* Sign In - Subtle approach */}
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="text-gray-600 hover:text-gray-900 font-medium"
      >
        <Link to="/signin" className="flex items-center">
          <LogIn className="mr-2" size={16} />
          Sign In
        </Link>
      </Button>

      {/* Sign Up - Primary CTA */}
      <Button
        variant="purple"
        size="sm"
        asChild
        className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
      >
        <Link to="/signup" className="flex items-center">
          <User className="mr-2" size={16} />
          Get Started
        </Link>
      </Button>
    </div>
  );
};

export default AuthButtons;
