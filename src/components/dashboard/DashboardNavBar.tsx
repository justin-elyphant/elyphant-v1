
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, LogOut, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/auth";

const DashboardNavBar = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <nav className="flex justify-end gap-2 py-3 px-3 bg-white border-b">
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate("/marketplace")}
        className="flex items-center gap-2"
      >
        <ShoppingCart className="h-4 w-4" />
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
      <Button
        variant="outline"
        size="sm"
        onClick={signOut}
        className="flex items-center gap-2 text-destructive hover:text-destructive"
      >
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
      </Button>
    </nav>
  );
};

export default DashboardNavBar;
