
import React from "react";
import { Link } from "react-router-dom";
import { UserRound, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Logo from "@/components/home/components/Logo";

interface DashboardHeaderProps {
  userData: any;
  onLogout: () => void;
}

const DashboardHeader = ({ userData, onLogout }: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div className="flex items-center gap-4">
        <Logo />
      </div>
      
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {userData?.profileImage ? (
            <AvatarImage src={userData.profileImage} alt={userData.name} />
          ) : (
            <AvatarFallback className="bg-purple-100 text-purple-600 text-xl">
              {userData.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">Welcome, {userData.name}</h1>
          <p className="text-muted-foreground">What would you like to do today?</p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link to={`/profile/${userData.id}`}>
            <UserRound className="h-4 w-4 mr-2" />
            View Profile
          </Link>
        </Button>
        <Button variant="outline" onClick={onLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
