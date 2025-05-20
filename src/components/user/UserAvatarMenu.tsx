
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { User, Store, Settings, LogOut, LayoutDashboard } from "lucide-react"; // Updated icon import

import { useAuth } from "@/contexts/auth";

const UserAvatarMenu = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Get initials or fallback to "U"
  const getInitials = (email?: string | null) => {
    if (!email) return "U";
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full focus:outline-none">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.user_metadata?.avatar_url ?? undefined} />
            <AvatarFallback>
              {getInitials(user?.email)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background z-50">
        <DropdownMenuLabel>
          {user?.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Marketplace */}
        <DropdownMenuItem asChild>
          <Link to="/marketplace" className="flex w-full">
            <Store className="mr-2 h-4 w-4" />
            Marketplace
          </Link>
        </DropdownMenuItem>
        {/* Dashboard */}
        <DropdownMenuItem onClick={() => navigate("/dashboard")}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        {/* Profile / Account */}
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <User className="mr-2 h-4 w-4" />
          Account
        </DropdownMenuItem>
        {/* Settings */}
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        {/* Orders */}
        <DropdownMenuItem onClick={() => navigate("/orders")}>
          <span className="mr-2">🛒</span>
          Orders
        </DropdownMenuItem>
        {/* Payment */}
        <DropdownMenuItem onClick={() => navigate("/payments")}>
          <span className="mr-2">💳</span>
          Payment
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={signOut}
          className="text-red-500 focus:text-red-500"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAvatarMenu;
