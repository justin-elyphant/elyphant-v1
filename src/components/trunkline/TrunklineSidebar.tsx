import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Package,
  Users,
  MessageSquare,
  Settings,
  BarChart3,
  ShoppingCart,
  Building2,
  CreditCard,
  Search,
  ArrowLeft,
  Bug
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const navigationItems = [
  {
    title: "Overview",
    url: "/trunkline",
    icon: BarChart3,
    badge: null,
  },
  {
    title: "Orders",
    url: "/trunkline/orders",
    icon: Package,
    badge: null,
  },
  {
    title: "Customers",
    url: "/trunkline/customers",
    icon: Users,
    badge: null,
  },
  {
    title: "Returns",
    url: "/trunkline/returns",
    icon: Package,
    badge: null,
  },
  {
    title: "Support",
    url: "/trunkline/support",
    icon: MessageSquare,
    badge: "12",
  },
];

const systemItems = [
  {
    title: "Amazon Credentials",
    url: "/trunkline/amazon",
    icon: CreditCard,
  },
  {
    title: "Business Payment Methods",
    url: "/trunkline/business-payments",
    icon: CreditCard,
  },
  {
    title: "Zinc Integration",
    url: "/trunkline/zinc",
    icon: Settings,
  },
  {
    title: "Zinc Debugger",
    url: "/trunkline/zinc-debugger",
    icon: Bug,
  },
  {
    title: "Vendors",
    url: "/trunkline/vendors",
    icon: Building2,
  },
];

export function TrunklineSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();

  const isActive = (url: string) => {
    if (url === "/trunkline") {
      return location.pathname === "/trunkline";
    }
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar className="border-r border-slate-200">
      <SidebarHeader className="border-b border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="p-1 h-auto"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {state === "expanded" && (
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-slate-900">Trunkline</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full border border-amber-200">
                  Internal
                </span>
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full border border-slate-200">
                  Test Mode
                </span>
              </div>
            </div>
          )}
        </div>
        
        {state === "expanded" && (
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search orders, customers..."
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={isActive(item.url) ? "bg-slate-100 text-slate-900 font-medium" : ""}
                  >
                    <button
                      onClick={() => navigate(item.url)}
                      className="flex items-center gap-3 w-full"
                    >
                      <item.icon className="h-4 w-4" />
                      {state === "expanded" && (
                        <>
                          <span>{item.title}</span>
                          {item.badge && (
                            <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={isActive(item.url) ? "bg-slate-100 text-slate-900 font-medium" : ""}
                  >
                    <button
                      onClick={() => navigate(item.url)}
                      className="flex items-center gap-3 w-full"
                    >
                      <item.icon className="h-4 w-4" />
                      {state === "expanded" && <span>{item.title}</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200 p-4">
        {state === "expanded" && (
          <div className="text-xs text-slate-500">
            <p>Enhanced Zinc API</p>
            <p className="text-green-600">● Connected</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
