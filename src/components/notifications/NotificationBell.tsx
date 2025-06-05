
import React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

export const NotificationBell = () => {
  const isMobile = useIsMobile();
  const notificationCount = 3; // Mock count for demo

  return (
    <Button
      variant="ghost"
      size={isMobile ? "touch" : "icon"}
      className="relative h-10 w-10"
      aria-label={`Notifications - ${notificationCount} unread`}
    >
      <Bell size={isMobile ? 24 : 20} />
      {notificationCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold"
        >
          {notificationCount > 99 ? "99+" : notificationCount}
        </Badge>
      )}
    </Button>
  );
};
