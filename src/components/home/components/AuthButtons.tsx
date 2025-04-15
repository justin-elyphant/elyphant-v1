
import React from "react";
import { Link } from "react-router-dom";
import { LogIn, User, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface AuthButtonsProps {
  profileImage?: string | null;
}

const AuthButtons = ({ profileImage }: AuthButtonsProps) => {
  // Use a try-catch to safely access the auth context
  let user = null;
  let signOut = null;
  let isLoading = false;
  
  try {
    const auth = useAuth();
    user = auth?.user;
    signOut = auth?.signOut;
    isLoading = auth?.isLoading || false;
  } catch (error) {
    console.warn("Auth context not available in AuthButtons");
    // Continue with default values if context is not available
  }

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();  // Stop event propagation to prevent dropdown issues
    
    console.log("Sign out button clicked, signOut function available:", !!signOut);
    
    if (signOut) {
      try {
        console.log("Executing signOut function...");
        toast.loading("Signing out...");
        await signOut();
      } catch (error) {
        console.error("Error signing out:", error);
        toast.dismiss();
        toast.error("Failed to sign out");
      }
    } else {
      console.error("SignOut function is not available");
      toast.error("Sign out functionality is not available");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-3">
        <div className="h-9 w-24 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

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
              {profileImage || user.user_metadata?.profile_image ? (
                <AvatarImage src={profileImage || user.user_metadata?.profile_image} alt={user.user_metadata?.name || user.email || ''} />
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
            <DropdownMenuItem 
              onClick={handleSignOut} 
              className="text-destructive cursor-pointer flex items-center hover:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    );
  }

  return (
    <nav className="flex items-center space-x-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-purple-600 hover:bg-purple-700" size="sm">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <Link to="/signin" className="flex w-full items-center">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/signup" className="flex w-full items-center">
              <User className="mr-2 h-4 w-4" />
              Create Account
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
};

export default AuthButtons;
