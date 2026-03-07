import React from "react";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface VendorTopBarProps {
  sidebarCollapsed: boolean;
}

const VendorTopBar: React.FC<VendorTopBarProps> = ({ sidebarCollapsed }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-20 h-14 bg-card border-b border-border flex items-center justify-between px-6 transition-all duration-200",
        sidebarCollapsed ? "left-[60px]" : "left-[220px]"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border">
          Test Mode
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground relative">
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-accent text-foreground">
              <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/vendor/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/")}>
              Back to Elyphant
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default VendorTopBar;
