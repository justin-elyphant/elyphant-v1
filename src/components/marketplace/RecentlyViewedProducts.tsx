
import React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useProductRecommendations } from "@/hooks/useProductRecommendations";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const RecentlyViewedProducts = () => {
  const { recentlyViewedItems } = useRecentlyViewed();
  const { recommendations } = useProductRecommendations();
  const isMobile = useIsMobile();
  
  // If no recently viewed items, don't show this section
  if (!recentlyViewedItems || recentlyViewedItems.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-12 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recently Viewed</h2>
        <Link to="/marketplace/history" className="text-sm text-purple-600 hover:underline">
          View all
        </Link>
      </div>
      
      <ScrollArea className="w-full whitespace-nowrap pb-4">
        <div className="flex gap-4">
          {recentlyViewedItems.slice(0, 8).map((item) => (
            <Link 
              key={item.id} 
              to={`/marketplace?productId=${item.id}`} 
              className={cn(
                "inline-block rounded-md border border-gray-200 overflow-hidden hover:shadow transition-shadow",
                isMobile ? "w-32" : "w-48"
              )}
            >
              <div className="aspect-square relative">
                <img 
                  src={item.image || "/placeholder.svg"} 
                  alt={item.name} 
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              </div>
              <div className="p-2">
                <p className="text-sm font-medium whitespace-normal line-clamp-1">
                  {item.name}
                </p>
                <p className="text-sm font-bold text-gray-900">${item.price?.toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      
      {recommendations.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">You Might Also Like</h2>
            <Link to="/marketplace" className="text-sm text-purple-600 hover:underline">
              Explore more
            </Link>
          </div>
          
          <ScrollArea className="w-full whitespace-nowrap pb-4">
            <div className="flex gap-4">
              {recommendations.slice(0, 8).map((product) => (
                <Link 
                  key={product.product_id || product.id} 
                  to={`/marketplace?productId=${product.product_id || product.id}`} 
                  className={cn(
                    "inline-block rounded-md border border-gray-200 overflow-hidden hover:shadow transition-shadow",
                    isMobile ? "w-32" : "w-48"
                  )}
                >
                  <div className="aspect-square relative">
                    <img 
                      src={product.image || "/placeholder.svg"} 
                      alt={product.title || product.name || "Product"} 
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium whitespace-normal line-clamp-1">
                      {product.title || product.name}
                    </p>
                    <p className="text-sm font-bold text-gray-900">${product.price?.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default RecentlyViewedProducts;
