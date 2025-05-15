
import React from "react";
import { Button } from "@/components/ui/button";
import { LogOut, MessageSquare, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  userData: any;
  onLogout: () => void;
}

const DashboardHeader = ({ userData, onLogout }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {userData.user_metadata?.name || userData.email?.split('@')[0] || "User"}
        </h1>
        <p className="text-sm text-muted-foreground">What would you like to do today?</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/marketplace")}
          className="flex items-center gap-2"
        >
          <Store className="h-4 w-4" />
          <span>Marketplace</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/messages/mock-friend")}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Messages</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onLogout} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
