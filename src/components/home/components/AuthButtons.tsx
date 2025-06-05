
import React from "react";
import { Link } from "react-router-dom";
import { LogIn, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

interface AuthButtonsProps {
  profileImage?: string | null;
}

const AuthButtons = (_props: AuthButtonsProps) => {
  const isMobile = useIsMobile();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="purple"
          size="sm"
          className="flex items-center h-9"
        >
          <User className="mr-2" size={16} />
          Sign Up
          <ChevronDown className="ml-2" size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 z-50 bg-white shadow-lg border rounded-md">
        <DropdownMenuItem asChild>
          <Link to="/signup" className="flex items-center min-h-[44px] px-3">
            <User className="mr-2" size={16} />
            Sign Up
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/signin" className="flex items-center min-h-[44px] px-3">
            <LogIn className="mr-2" size={16} />
            Sign In
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AuthButtons;
