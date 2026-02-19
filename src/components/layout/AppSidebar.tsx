
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  ShoppingBag,
  ShoppingCart,
  Heart,
  Package,
  Gift,
  Users,
  MessageCircle,
  Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/contexts/notifications/NotificationsContext";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useConnectionsAdapter } from "@/hooks/useConnectionsAdapter";
import { useCart } from "@/contexts/CartContext";

const AppSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const unreadMessagesCount = useUnreadMessagesCount();
  const { pendingConnections } = useConnectionsAdapter();
  const { unreadCount: notificationsCount } = useNotifications();
  const { getItemCount } = useCart();
  const cartItemCount = getItemCount();
  
  // Don't render sidebar for guests (unauthenticated users)
  if (!user) {
    return null;
  }

  // Shopping section
  const shoppingItems = [
    {
      title: "Shop",
      url: "/marketplace",
      icon: ShoppingBag,
    },
    {
      title: "Cart",
      url: "/cart",
      icon: ShoppingCart,
      badge: cartItemCount > 0 ? cartItemCount : undefined,
    },
    {
      title: "Orders",
      url: "/orders",
      icon: Package,
    },
  ];

  // Gifting section
  const giftingItems = [
    {
      title: "Recurring Gifts",
      url: "/recurring-gifts",
      icon: Gift,
    },
    {
      title: "Wishlists",
      url: "/wishlists",
      icon: Heart,
    },
    {
      title: "Connections",
      url: "/connections",
      icon: Users,
      badge: pendingConnections.length > 0 ? pendingConnections.length : undefined,
    },
  ];

  // Communication section
  const communicationItems = [
    {
      title: "Messages",
      url: "/messages",
      icon: MessageCircle,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: Bell,
      badge: notificationsCount > 0 ? notificationsCount : undefined,
    },
  ];

  const isActiveRoute = (url: string) => {
    if (url === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar className="border-r" collapsible="icon">
      <SidebarContent>
        {/* Shopping Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Shopping</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {shoppingItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActiveRoute(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Gifting Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Gifting</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {giftingItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActiveRoute(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Communication Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Communication</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {communicationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActiveRoute(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
};

export { AppSidebar };
