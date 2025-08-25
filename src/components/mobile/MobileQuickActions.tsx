import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useCart } from "@/contexts/CartContext";
import { 
  Zap, 
  RotateCcw, 
  Eye, 
  Heart, 
  MessageCircle,
  Gift,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "secondary";
  show: boolean;
  priority: number;
}

const MobileQuickActions: React.FC = () => {
  const { user } = useAuth();
  const { cartItems } = useCart();
  
  // Placeholder for recently viewed - would come from a separate hook
  const recentlyViewed: any[] = [];
  const hasCartItems = cartItems.length > 0;
  
  const quickActions: QuickAction[] = [
    {
      id: "express-checkout",
      label: "Express Checkout",
      icon: <Zap className="h-4 w-4" />,
      href: "/checkout?express=true",
      variant: "default",
      show: !!user && hasCartItems,
      priority: 1,
    },
    {
      id: "quick-reorder",
      label: "Quick Reorder",
      icon: <RotateCcw className="h-4 w-4" />,
      href: "/orders?action=reorder",
      variant: "outline",
      show: !!user,
      priority: 2,
    },
    {
      id: "recently-viewed",
      label: "Recently Viewed",
      icon: <Eye className="h-4 w-4" />,
      href: "/recently-viewed",
      variant: "outline",
      show: recentlyViewed.length > 0,
      priority: 3,
    },
    {
      id: "ai-recommendations",
      label: "AI Picks",
      icon: <Sparkles className="h-4 w-4" />,
      href: "/nicole?context=recommendations",
      variant: "secondary",
      show: !!user,
      priority: 4,
    },
    {
      id: "gift-recommendations",
      label: "Gift Ideas",
      icon: <Gift className="h-4 w-4" />,
      href: "/gifting?action=recommendations",
      variant: "outline",
      show: !!user,
      priority: 5,
    },
    {
      id: "messages",
      label: "Messages",
      icon: <MessageCircle className="h-4 w-4" />,
      href: "/messages",
      variant: "outline",
      show: !!user,
      priority: 6,
    }
  ];

  const visibleActions = quickActions
    .filter(action => action.show)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 4); // Show max 4 actions to avoid clutter

  if (visibleActions.length === 0) return null;

  return (
    <div className="md:hidden bg-background/95 backdrop-blur-lg border-t border-border p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Quick Actions</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => {
            // Toggle quick actions visibility
            const element = document.querySelector('[data-quick-actions]');
            element?.classList.toggle('hidden');
          }}
        >
          Hide
        </Button>
      </div>
      
      <div 
        data-quick-actions
        className="grid grid-cols-2 gap-2"
      >
        {visibleActions.map((action) => (
          <Button
            key={action.id}
            asChild={!!action.href}
            variant={action.variant}
            size="sm"
            className={cn(
              "justify-start h-10",
              action.variant === "default" && "bg-primary hover:bg-primary/90"
            )}
            onClick={action.onClick}
          >
            {action.href ? (
              <Link to={action.href} className="flex items-center">
                {action.icon}
                <span className="ml-2 text-xs">{action.label}</span>
              </Link>
            ) : (
              <span className="flex items-center">
                {action.icon}
                <span className="ml-2 text-xs">{action.label}</span>
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default MobileQuickActions;