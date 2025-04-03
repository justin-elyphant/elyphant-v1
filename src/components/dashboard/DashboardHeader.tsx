
import React from "react";

interface DashboardHeaderProps {
  userData: any;
  onLogout: () => void;
}

const DashboardHeader = ({ userData }: DashboardHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {userData.name}</h1>
        <p className="text-muted-foreground">What would you like to do today?</p>
      </div>
    </div>
  );
};

export default DashboardHeader;
