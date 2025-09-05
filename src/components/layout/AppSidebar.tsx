
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
  Heart,
  Package,
  Gift,
  Users,
  Brain,
  LayoutGrid,
  User,
  MessageCircle
} from "lucide-react";
import Logo from "@/components/home/components/Logo";
import { useAuth } from "@/contexts/auth";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/contexts/notifications/NotificationsContext";
import { useConnectionsAdapter } from "@/hooks/useConnectionsAdapter";

const AppSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount: messageCount } = useNotifications();
  const { pendingConnections } = useConnectionsAdapter();

  // Personal dashboard 
  const personalItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutGrid,
    },
  ];

  // Shopping workflows
  const shoppingItems = [
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

  // Communication and AI workflows
  const communicationItems = [
    {
      title: "Connections",
      url: "/connections",
      icon: Users,
      badge: pendingConnections.length > 0 ? pendingConnections.length : undefined,
    },
    {
      title: "Messages",
      url: "/messages",
      icon: MessageCircle,
      badge: messageCount > 0 ? messageCount : undefined,
    },
    {
      title: "Gifting Hub",
      url: "/gifting",
      icon: Gift,
    },
    {
      title: "Nicole AI",
      url: "/nicole",
      icon: Brain,
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
      <SidebarHeader className="p-4">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        {/* Personal Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {personalItems.map((item) => (
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
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Communication & AI Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Communication & AI</SidebarGroupLabel>
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
