
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, UserRound, LogOut, LayoutDashboard } from "lucide-react";

const UserAvatarMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Attempt to fetch avatar from user profile, fallback to initials
  const avatarUrl = user?.user_metadata?.avatar_url || undefined;
  const displayName = user?.user_metadata?.name || user?.email || "";
  const initials =
    displayName?.split(" ").length > 1
      ? displayName
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()
      : displayName?.substring(0, 2).toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          aria-label="Open user menu"
        >
          <Avatar className="h-9 w-9 border border-gray-200">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-purple-100 text-purple-800 font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background">
        <div className="px-3 pt-2 pb-1 font-semibold text-base">{displayName}</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/dashboard")}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <UserRound className="mr-2 h-4 w-4" />
          Account
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/orders")}>
          <span className="mr-2">🛒</span>
          Orders
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/payments")}>
          <span className="mr-2">💳</span>
          Payment
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={signOut}
          className="text-red-600 hover:text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAvatarMenu;

