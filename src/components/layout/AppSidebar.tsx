
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Home,
  ShoppingBag,
  ShoppingCart,
  User,
  Settings,
  Users,
  Heart,
  Package,
  MessageSquare,
  LayoutDashboard,
} from "lucide-react";
import Logo from "@/components/home/components/Logo";
import { useAuth } from "@/contexts/auth";
import NotificationBadge from "@/components/notifications/NotificationBadge";
import { usePendingConnectionsCount } from "@/hooks/usePendingConnectionsCount";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";

const AppSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const pendingConnectionsCount = usePendingConnectionsCount();
  const unreadMessagesCount = useUnreadMessagesCount();

  const mainMenuItems = [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Marketplace",
      url: "/marketplace",
      icon: ShoppingBag,
    },
    {
      title: "Cart",
      url: "/cart",
      icon: ShoppingCart,
    },
  ];

  const userMenuItems = user ? [
    {
      title: "Profile",
      url: "/profile",
      icon: User,
    },
    {
      title: "Messages",
      url: "/messages",
      icon: MessageSquare,
      badge: unreadMessagesCount,
    },
    {
      title: "Connections",
      url: "/connections",
      icon: Users,
      badge: pendingConnectionsCount,
    },
    {
      title: "Wishlists",
      url: "/wishlists",
      icon: Heart,
    },
    {
      title: "Orders",
      url: "/orders",
      icon: Package,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ] : [];

  const isActiveRoute = (url: string) => {
    if (url === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar className="border-r" collapsible="icon">
      <SidebarHeader className="p-4">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActiveRoute(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActiveRoute(item.url)}>
                      <Link to={item.url} className="relative">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.badge && item.badge > 0 && (
                          <NotificationBadge 
                            count={item.badge} 
                            className="ml-auto"
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
};

export { AppSidebar };
