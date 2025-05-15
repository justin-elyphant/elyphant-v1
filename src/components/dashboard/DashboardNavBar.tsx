
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/auth";

const DashboardNavBar = () => {
  const navigate = useNavigate();

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
    </nav>
  );
};

export default DashboardNavBar;
