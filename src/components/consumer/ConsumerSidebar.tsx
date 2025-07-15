import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Heart,
  Users,
  Gift,
  MessageSquare,
  User,
  Settings,
  Search,
  Bell,
  Package,
  Calendar,
  CreditCard,
  HelpCircle,
  Target
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
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useCart } from "@/contexts/CartContext";
import { Database } from "@/integrations/supabase/types";

const mainItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    title: "Marketplace",
    url: "/marketplace",
    icon: ShoppingCart,
    badge: null,
    external: true, // Opens in full-width layout
  },
];

const shoppingItems = [
  {
    title: "My Cart",
    url: "/cart",
    icon: ShoppingCart,
    badge: "cart",
  },
  {
    title: "My Orders",
    url: "/orders",
    icon: Package,
    badge: null,
  },
  {
    title: "My Wishlists",
    url: "/wishlists",
    icon: Heart,
    badge: null,
  },
];

const giftingItems = [
  {
    title: "Gift Search",
    url: "/gift-search",
    icon: Target,
    badge: null,
  },
  {
    title: "Group Gifts",
    url: "/group-gifts",
    icon: Gift,
    badge: null,
  },
  {
    title: "Special Dates",
    url: "/special-dates",
    icon: Calendar,
    badge: null,
  },
];

const socialItems = [
  {
    title: "Connections",
    url: "/connections",
    icon: Users,
    badge: null,
  },
  {
    title: "Messages",
    url: "/messages",
    icon: MessageSquare,
    badge: "messages",
  },
];

const personalItems = [
  {
    title: "Profile",
    url: "/profile",
    icon: User,
    badge: null,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    badge: null,
  },
];

const helpItems = [
  {
    title: "Help & Support",
    url: "/help",
    icon: HelpCircle,
    badge: null,
  },
];

export function ConsumerSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { cartItems } = useCart();
  const [searchTerm, setSearchTerm] = useState("");

  const isActive = (url: string) => {
    if (url === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    if (url === "/profile") {
      return location.pathname === `/profile/${user?.id}` || location.pathname === "/profile";
    }
    return location.pathname.startsWith(url);
  };

  const getBadgeCount = (badgeType: string) => {
    switch (badgeType) {
      case "cart":
        return cartItems?.length > 0 ? cartItems.length.toString() : null;
      case "messages":
        return "3"; // TODO: Replace with actual unread count
      default:
        return null;
    }
  };

  const handleNavigation = (url: string, external: boolean = false) => {
    if (external) {
      // For marketplace, navigate to full-width layout
      navigate(url);
    } else {
      navigate(url);
    }
  };

  const MenuSection = ({ title, items }: { title: string; items: any[] }) => (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const badgeCount = item.badge ? getBadgeCount(item.badge) : null;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className={isActive(item.url) ? "bg-slate-100 text-slate-900 font-medium" : ""}
                >
                  <button
                    onClick={() => handleNavigation(item.url, item.external)}
                    className="flex items-center gap-3 w-full"
                  >
                    <item.icon className="h-4 w-4" />
                    {state === "expanded" && (
                      <>
                        <span>{item.title}</span>
                        {badgeCount && (
                          <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {badgeCount}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar className="border-r border-slate-200">
      <SidebarHeader className="border-b border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          {state === "expanded" && (
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-slate-900">Elyphant</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200">
                  Online
                </span>
                {user && (
                  <span className="text-xs text-slate-500">
                    {(profile as any)?.first_name || (profile as any)?.name || user.email?.split('@')[0]}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {state === "expanded" && (
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search gifts, friends, orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        <MenuSection title="Main" items={mainItems} />
        <SidebarSeparator />
        <MenuSection title="Shopping" items={shoppingItems} />
        <SidebarSeparator />
        <MenuSection title="Gifting" items={giftingItems} />
        <SidebarSeparator />
        <MenuSection title="Social" items={socialItems} />
        <SidebarSeparator />
        <MenuSection title="Personal" items={personalItems} />
        <SidebarSeparator />
        <MenuSection title="Help" items={helpItems} />
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200 p-4">
        {state === "expanded" && (
          <div className="text-xs text-slate-500">
            <p>Gift Intelligence</p>
            <p className="text-green-600">● Active</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}