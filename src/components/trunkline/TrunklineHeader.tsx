import React from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Settings } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import UserButton from "@/components/auth/UserButton";

const TrunklineHeader = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="lg:hidden" />
        <h1 className="text-lg font-semibold text-slate-900">Trunkline</h1>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4 text-slate-600" />
          <span className="sr-only">Notifications</span>
        </Button>

        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate("/settings")}
        >
          <Settings className="h-4 w-4 text-slate-600" />
          <span className="sr-only">Settings</span>
        </Button>

        {user ? (
          <UserButton />
        ) : (
          <Button 
            onClick={() => navigate("/auth")}
            size="sm"
            variant="outline"
          >
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
};

export default TrunklineHeader;