import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Heart, 
  Settings, 
  ShoppingBag, 
  CreditCard, 
  User, 
  LogOut,
  Store
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useProfileDataIntegrity } from "@/hooks/common/useProfileDataIntegrity";
import NotificationBadge from "@/components/notifications/NotificationBadge";

const mainNavigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Marketplace",
    url: "/marketplace",
    icon: Store,
  },
  {
    title: "Messages",
    url: "/messages",
    icon: MessageSquare,
  },
  {
    title: "Connections",
    url: "/connections",
    icon: Users,
  },
  {
    title: "Wishlists",
    url: "/wishlists",
    icon: Heart,
  },
  {
    title: "Orders",
    url: "/orders",
    icon: ShoppingBag,
  },
];

const accountItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Payment",
    url: "/payments",
    icon: CreditCard,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { hasIssues } = useProfileDataIntegrity();
  
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/profile") {
      // Handle profile routes more specifically
      const profileIdentifier = profile?.username || user?.id;
      return currentPath === `/profile/${profileIdentifier}` || currentPath === "/profile";
    }
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  const getNavClassName = (path: string) => {
    return isActive(path) 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
  };

  const handleProfileClick = () => {
    const profileIdentifier = profile?.username || user?.id;
    if (profileIdentifier) {
      navigate(`/profile/${profileIdentifier}`);
    } else {
      navigate("/signup?intent=complete-profile");
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Sidebar Trigger */}
      <div className="p-2">
        <SidebarTrigger className="h-8 w-8" />
      </div>
      
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            {!isCollapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && (
                        <span className="relative">
                          {item.title}
                          {item.title === "Dashboard" && hasIssues && (
                            <NotificationBadge 
                              count={1} 
                              className="absolute -top-2 -right-2 min-w-[1rem] h-4 text-xs"
                            />
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Account Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            {!isCollapsed && "Account"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {item.title === "Profile" ? (
                      <button 
                        onClick={handleProfileClick}
                        className={`w-full flex items-center gap-2 h-8 px-2 rounded-md text-sm ${getNavClassName("/profile")}`}
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </button>
                    ) : (
                      <NavLink to={item.url} className={getNavClassName(item.url)}>
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with Sign Out */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}