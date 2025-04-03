
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from "@/components/home/components/Logo";

interface DashboardHeaderProps {
  userData: any;
  onLogout: () => void;
}

const DashboardHeader = ({ userData }: DashboardHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-4">
        <Logo />
        <div>
          <h1 className="text-2xl font-bold">Welcome, {userData.name}</h1>
          <p className="text-muted-foreground">What would you like to do today?</p>
        </div>
      </div>
      
      <Avatar className="h-12 w-12">
        {userData?.profileImage ? (
          <AvatarImage src={userData.profileImage} alt={userData.name} />
        ) : (
          <AvatarFallback className="bg-purple-100 text-purple-600 text-xl">
            {userData.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
    </div>
  );
};

export default DashboardHeader;
