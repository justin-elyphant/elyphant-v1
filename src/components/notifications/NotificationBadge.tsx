
import React from "react";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  maxCount?: number;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  className,
  maxCount = 99
}) => {
  if (count <= 0) return null;
  
  const displayCount = count > maxCount ? `${maxCount}+` : count;
  
  return (
    <span 
      className={cn(
        "absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs min-w-[1.25rem] h-5 px-1",
        "animate-in fade-in-50 zoom-in-95 duration-300",
        count > maxCount ? "px-1.5" : "", 
        className
      )}
    >
      {displayCount}
    </span>
  );
};

export default NotificationBadge;
