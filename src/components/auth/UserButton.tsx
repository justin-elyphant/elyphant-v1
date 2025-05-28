
import React from "react";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, Settings, Heart, Store, MessageSquare, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";

const UserButton = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "GG";
  
  const handleSignOut = async () => {
    await signOut();
  };

  const handleProfileClick = () => {
    if (user?.id) {
      navigate(`/profile/${user.id}`);
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-1 hover:opacity-80 transition-opacity relative focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500 rounded-full">
          <Avatar className="h-8 w-8 border border-gray-200">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-purple-100 text-purple-800 text-sm font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 bg-background z-50">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user?.email && (
              <p className="font-medium">{user.email}</p>
            )}
          </div>
        </div>
        
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => navigate("/marketplace")}>
          <Store className="mr-2 h-4 w-4" />
          <span>Marketplace</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate("/messages")}>
          <MessageSquare className="mr-2 h-4 w-4" />
          <span>Messages</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate("/dashboard")}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleProfileClick}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate("/wishlists")}>
          <Heart className="mr-2 h-4 w-4" />
          <span>My Wishlists</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate("/orders")}>
          <span className="mr-2">🛒</span>
          <span>Orders</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate("/payments")}>
          <span className="mr-2">💳</span>
          <span>Payment</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
