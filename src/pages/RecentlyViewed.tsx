import React from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { ShoppingCart, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

const RecentlyViewed: React.FC = () => {
  const { recentlyViewed, loading, removeItem, clearAll } = useRecentlyViewed();
  const { toast } = useToast();

  const handleRemoveItem = (productId: string, productTitle: string) => {
    removeItem(productId);
    toast(`"${productTitle}" was removed from recently viewed`);
  };

  const handleClearAll = () => {
    clearAll();
    toast("Your recently viewed list has been cleared");
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your recently viewed items...</p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Recently Viewed</h1>
            <p className="text-muted-foreground mt-1">
              {recentlyViewed.length > 0 
                ? `${recentlyViewed.length} item${recentlyViewed.length !== 1 ? 's' : ''} recently viewed`
                : "No items viewed recently"
              }
            </p>
          </div>
          
          {recentlyViewed.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleClearAll}
              className="w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {/* Content */}
        {recentlyViewed.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Eye className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Recently Viewed Items</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Start browsing products to see them appear here. Your recently viewed items will be saved for easy access.
              </p>
              <Button asChild>
                <Link to="/marketplace">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Browse Products
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recentlyViewed.map((item) => (
              <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <Link to={`/marketplace/product/${item.product_id}`} className="block">
                    <AspectRatio ratio={1} className="overflow-hidden rounded-t-lg">
                      <img
                        src={item.product_data.image_url || "/placeholder.svg"}
                        alt={item.product_data.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                      />
                    </AspectRatio>
                  </Link>
                  
                  <div className="p-4 space-y-3">
                    <div>
                      <Link 
                        to={`/marketplace/product/${item.product_id}`}
                        className="block hover:text-primary transition-colors"
                      >
                        <h3 className="font-semibold line-clamp-2 text-sm">
                          {item.product_data.title}
                        </h3>
                      </Link>
                      
                      {item.product_data.brand && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.product_data.brand}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      {item.product_data.price && (
                        <span className="font-bold text-lg">
                          ${item.product_data.price.toFixed(2)}
                        </span>
                      )}
                      
                      <Badge variant="secondary" className="text-xs">
                        {formatDistanceToNow(new Date(item.viewed_at), { addSuffix: true })}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button asChild size="sm" className="flex-1">
                        <Link to={`/marketplace/product/${item.product_id}`}>
                          <Eye className="w-3 h-3 mr-1" />
                          View Again
                        </Link>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemoveItem(item.product_id, item.product_data.title);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default RecentlyViewed;