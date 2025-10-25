import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wishlist } from "@/types/profile";
import { Package, DollarSign, TrendingUp, Grid3x3 } from "lucide-react";

interface WishlistSidebarProps {
  wishlist: Wishlist;
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

const WishlistSidebar = ({
  wishlist,
  selectedCategory,
  onCategorySelect
}: WishlistSidebarProps) => {
  const totalValue = wishlist.items.reduce((sum, item) => sum + (item.price || 0), 0);
  const avgPrice = wishlist.items.length > 0 ? totalValue / wishlist.items.length : 0;

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
    <div className="w-64 space-y-4">
      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              Total Items
            </div>
            <span className="font-semibold">{wishlist.items.length}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Total Value
            </div>
            <span className="font-semibold">${totalValue.toFixed(2)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Avg Price
            </div>
            <span className="font-semibold">${avgPrice.toFixed(2)}</span>
          </div>
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
