
import React from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface DashboardHeaderProps {
  userData: any;
  onLogout: () => void;
}

const DashboardHeader = ({ userData, onLogout }: DashboardHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {userData.user_metadata?.name || userData.email?.split('@')[0] || 'User'}</h1>
        <p className="text-muted-foreground">What would you like to do today?</p>
      </div>
      
      <Button variant="outline" size="sm" onClick={onLogout} className="flex items-center gap-2">
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
      </Button>
    </div>
  );
};

export default DashboardHeader;
