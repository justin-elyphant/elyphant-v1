
import React from "react";
import { Link } from "react-router-dom";
import { LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AuthButtons = () => {
  const [userData] = useLocalStorage("userData", null);

  if (userData) {
    return (
      <nav className="flex items-center space-x-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/dashboard">
            Dashboard
          </Link>
        </Button>
        <Link to={`/profile/${userData.id}`}>
          <Avatar className="h-9 w-9 cursor-pointer">
            {userData?.profileImage ? (
              <AvatarImage src={userData.profileImage} alt={userData.name} />
            ) : (
              <AvatarFallback className="bg-purple-100 text-purple-600 text-sm">
                {userData.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
        </Link>
      </nav>
    );
  }

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
