
import React from "react";
import NavigationBar from "./components/NavigationBar";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  // Try to detect if we're in a sidebar context
  let showSidebarTrigger = false;
  try {
    const sidebar = useSidebar();
    showSidebarTrigger = true;
  } catch {
    // Not in sidebar context
  }
  
  return (
    <header className={cn("sticky top-0 z-50 bg-white border-b", className)}>
      <div className="flex items-center">
        {/* Show sidebar trigger if we're in a sidebar layout */}
        {showSidebarTrigger && (
          <SidebarTrigger className="ml-4 mr-2" />
        )}
        <div className="flex-1">
          <NavigationBar />
        </div>
      </div>
    </header>
  );
};

export default Header;
