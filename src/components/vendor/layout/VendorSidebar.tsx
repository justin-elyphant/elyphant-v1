import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Plug,
  HeadphonesIcon,
  Settings,
  Megaphone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import ElyphantTextLogo from "@/components/ui/ElyphantTextLogo";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/vendor", icon: LayoutDashboard },
  { label: "Orders", href: "/vendor/orders", icon: ShoppingCart },
  { label: "Products", href: "/vendor/products", icon: Package },
  { label: "Advertising", href: "/vendor/advertising", icon: Megaphone },
  { label: "Analytics", href: "/vendor/analytics", icon: BarChart3 },
  { label: "Support", href: "/vendor/support", icon: HeadphonesIcon },
  { label: "Settings", href: "/vendor/settings", icon: Settings },
];

interface VendorSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const VendorSidebar: React.FC<VendorSidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (href: string) => {
    if (href === "/vendor") return location.pathname === "/vendor";
    return location.pathname.startsWith(href);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed top-0 left-0 z-30 h-screen bg-card border-r border-border flex flex-col transition-all duration-200",
          collapsed ? "w-[60px]" : "w-[220px]"
        )}
      >
        {/* Logo area */}
        <div className={cn(
          "h-14 flex items-center border-b border-border px-3",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed ? (
            <Link to="/" className="flex-1 min-w-0">
              <ElyphantTextLogo />
            </Link>
          ) : (
            <Link to="/">
              <img
                src="/lovable-uploads/9b4f3dc7-ff8b-46c4-9eb3-56681e8c73b9.png"
                alt="Elyphant logo"
                className="h-7 w-auto"
              />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            const button = (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </nav>

        {/* Bottom section */}
        <div className={cn(
          "border-t border-border px-3 py-3",
          collapsed ? "text-center" : ""
        )}>
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            {!collapsed && <span>Back to Elyphant</span>}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default VendorSidebar;
