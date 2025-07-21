
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingCart, User, Gift } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useIsMobile } from "@/hooks/use-mobile";

const MobileQuickActions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const quickActions = [
    {
      icon: <Search className="h-5 w-5" />,
      label: "Search",
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Focus on search bar in header
        const searchInput = document.querySelector('input[placeholder*="search" i]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    },
    {
      icon: <Gift className="h-5 w-5" />,
      label: "Gift Ideas",
      action: () => navigate("/marketplace?search=gift ideas")
    },
    {
      icon: <Heart className="h-5 w-5" />,
      label: "Wishlist",
      action: () => navigate(user ? "/wishlists" : "/auth")
    },
    {
      icon: <ShoppingCart className="h-5 w-5" />,
      label: "Cart",
      action: () => {
        // Trigger shopping cart button
        const cartButton = document.querySelector('[aria-label="Shopping cart"]') as HTMLButtonElement;
        if (cartButton) {
          cartButton.click();
        }
      }
    }
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none">
      <div className="bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-2xl shadow-lg p-3 pointer-events-auto">
        <div className="flex justify-around items-center">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={action.action}
              className="flex flex-col items-center gap-1 h-auto py-2 px-3 hover:bg-purple-50 touch-target-48"
              aria-label={action.label}
            >
              <div className="text-purple-600">
                {action.icon}
              </div>
              <span className="text-xs text-gray-600 font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileQuickActions;
