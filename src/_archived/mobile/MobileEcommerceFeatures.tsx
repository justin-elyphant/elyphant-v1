import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useCart } from "@/contexts/CartContext";
import { 
  Heart, 
  Share2, 
  Users, 
  Gift, 
  Zap,
  ShoppingCart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EcommerceAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary";
  show: boolean;
}

interface MobileEcommerceFeaturesProps {
  productId?: string;
  productName?: string;
  className?: string;
}

const MobileEcommerceFeatures: React.FC<MobileEcommerceFeaturesProps> = ({
  productId,
  productName,
  className
}) => {
  const { user } = useAuth();
  const { cartItems } = useCart();

  const handleQuickAddToWishlist = () => {
    if (!user) {
      toast.error("Please sign in to add items to your wishlist");
      return;
    }
    toast.success("Added to wishlist!", {
      description: `${productName || "Item"} saved for later`
    });
  };

  const handleShareProduct = () => {
    if (navigator.share && productName) {
      navigator.share({
        title: productName,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleGiftRecommendations = () => {
    toast.info("Finding gift ideas from your connections...");
  };

  const handleGroupBuying = () => {
    if (!user) {
      toast.error("Please sign in to start group buying");
      return;
    }
    toast.info("Starting group buy session...");
  };

  const handleOneClickReorder = () => {
    if (!user) {
      toast.error("Please sign in to reorder");
      return;
    }
    toast.success("Last order added to cart!");
  };

  const ecommerceActions: EcommerceAction[] = [
    {
      id: "add-to-wishlist",
      label: "Wishlist",
      icon: <Heart className="h-4 w-4" />,
      onClick: handleQuickAddToWishlist,
      variant: "outline",
      show: !!productId
    },
    {
      id: "share",
      label: "Share",
      icon: <Share2 className="h-4 w-4" />,
      onClick: handleShareProduct,
      variant: "outline",
      show: !!productId
    },
    {
      id: "gift-ideas",
      label: "Gift Ideas",
      icon: <Gift className="h-4 w-4" />,
      onClick: handleGiftRecommendations,
      variant: "secondary",
      show: !!user
    },
    {
      id: "group-buy",
      label: "Group Buy",
      icon: <Users className="h-4 w-4" />,
      onClick: handleGroupBuying,
      variant: "outline",
      show: !!user
    },
    {
      id: "reorder",
      label: "Reorder",
      icon: <Zap className="h-4 w-4" />,
      onClick: handleOneClickReorder,
      variant: "default",
      show: !!user
    }
  ];

  const visibleActions = ecommerceActions.filter(action => action.show);

  if (visibleActions.length === 0) return null;

  return (
    <div className={cn("md:hidden space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">
          Smart Shopping
        </h4>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {visibleActions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant}
            size="sm"
            onClick={action.onClick}
            className="flex flex-col items-center gap-1 h-16 p-2"
          >
            {action.icon}
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default MobileEcommerceFeatures;