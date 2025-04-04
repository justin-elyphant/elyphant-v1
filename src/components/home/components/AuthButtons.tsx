
import React from "react";
import { Link } from "react-router-dom";
import { LogIn, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const AuthButtons = () => {
  const { user, signOut } = useAuth();

  if (user) {
    return (
      <nav className="flex items-center space-x-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/dashboard">
            Dashboard
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-9 w-9 cursor-pointer">
              {user.user_metadata?.profile_image ? (
                <AvatarImage src={user.user_metadata.profile_image} alt={user.user_metadata?.name || user.email || ''} />
              ) : (
                <AvatarFallback className="bg-purple-100 text-purple-600 text-sm">
                  {(user.user_metadata?.name || user.email || '').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user.user_metadata?.name || user.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={`/profile/${user.id}`}>Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/wishlists">Wishlists</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
