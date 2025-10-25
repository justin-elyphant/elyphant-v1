import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Wishlist } from "@/types/profile";
import { Package, DollarSign, TrendingUp, Grid3x3, User, Share2 } from "lucide-react";
import WishlistShareButton from "../share/WishlistShareButton";
import { useWishlist } from "../../hooks/useWishlist";

interface WishlistSidebarProps {
  wishlist: Wishlist;
  ownerProfile: any;
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

const WishlistSidebar = ({
  wishlist,
  ownerProfile,
  selectedCategory,
  onCategorySelect
}: WishlistSidebarProps) => {
  const { updateWishlistSharing } = useWishlist();
  const totalValue = wishlist.items.reduce((sum, item) => sum + (item.price || 0), 0);
  const avgPrice = wishlist.items.length > 0 ? totalValue / wishlist.items.length : 0;
  
  // Mock purchase tracking (would come from database in production)
  const purchasedCount = 0; // Would be calculated from item purchase status
  const purchaseProgress = wishlist.items.length > 0 ? (purchasedCount / wishlist.items.length) * 100 : 0;

  // Extract categories from items (based on brands)
  const categories = React.useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    wishlist.items.forEach(item => {
      const brand = item.brand || 'Other';
      categoryMap.set(brand, (categoryMap.get(brand) || 0) + 1);
    });
    
    return Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [wishlist.items]);

  return (
    <div className="space-y-6 sticky top-6">
      {/* Profile Section - Babylist Style */}
      <Card className="overflow-hidden border-border/50 shadow-sm">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 border-b border-border/50">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16 border-2 border-background shadow-lg">
              <AvatarImage src={ownerProfile?.image} alt={ownerProfile?.name} />
              <AvatarFallback className="bg-primary/20 text-primary text-lg font-semibold">
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg mb-1 truncate">{wishlist.title}</h2>
              <p className="text-sm text-muted-foreground">{ownerProfile?.name}'s Wishlist</p>
            </div>
          </div>
          
          {wishlist.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {wishlist.description}
            </p>
          )}
        </div>
        
        <CardContent className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                <Package className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold">{wishlist.items.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Items</p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold">${totalValue.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Value</p>
            </div>
          </div>
          
          {/* Gift Tracker Widget */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Gift Progress</span>
              <span className="text-muted-foreground">{purchasedCount}/{wishlist.items.length} purchased</span>
            </div>
            <Progress value={purchaseProgress} className="h-2" />
          </div>
          
          {/* Share Button */}
          <WishlistShareButton 
            wishlist={wishlist}
            onShareSettingsChange={updateWishlistSharing}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Categories Quick Filter */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant={selectedCategory === null ? "default" : "ghost"}
              size="sm"
              className="w-full justify-between"
              onClick={() => onCategorySelect(null)}
            >
              <span>All Items</span>
              <Badge variant="secondary">{wishlist.items.length}</Badge>
            </Button>
            
            {categories.map(([category, count]) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "ghost"}
                size="sm"
                className="w-full justify-between"
                onClick={() => onCategorySelect(category)}
              >
                <span className="truncate">{category}</span>
                <Badge variant="secondary">{count}</Badge>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WishlistSidebar;
