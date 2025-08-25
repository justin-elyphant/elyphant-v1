import React from "react";
import { useAuth } from "@/contexts/auth";
import { useCart } from "@/contexts/CartContext";
import { usePendingConnectionsCount } from "@/hooks/usePendingConnectionsCount";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { cn } from "@/lib/utils";

interface BadgeProps {
  count: number;
  type: "cart" | "connections" | "messages" | "notifications";
  className?: string;
}

const NotificationBadge: React.FC<BadgeProps> = ({ count, type, className }) => {
  if (count === 0) return null;

  const badgeStyles = {
    cart: "bg-primary text-primary-foreground",
    connections: "bg-blue-500 text-white",
    messages: "bg-green-500 text-white", 
    notifications: "bg-destructive text-destructive-foreground"
  };

  return (
    <div 
      className={cn(
        "absolute -top-2 -right-2 text-xs font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 z-10",
        badgeStyles[type],
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </div>
  );
};

export const useNotificationBadges = () => {
  const { user } = useAuth();
  const { getItemCount } = useCart();
  const pendingConnectionsCount = usePendingConnectionsCount();
  const unreadMessagesCount = useUnreadMessagesCount();
  
  const cartCount = getItemCount();
  
  return {
    cart: cartCount,
    connections: user ? pendingConnectionsCount : 0,
    messages: user ? unreadMessagesCount : 0,
    total: cartCount + (user ? pendingConnectionsCount + unreadMessagesCount : 0)
  };
};

export default NotificationBadge;