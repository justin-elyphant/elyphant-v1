
import React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useProductRecommendations } from "@/hooks/useProductRecommendations";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ArrowRight, Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const RecentlyViewedProducts = () => {
  const { recentlyViewed } = useRecentlyViewed();
  const { recommendations } = useProductRecommendations();
  const isMobile = useIsMobile();
  
  // If no recently viewed items, don't show this section
  if (!recentlyViewed || recentlyViewed.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-12 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold">Recently Viewed</h2>
        </div>
        <Link to="/marketplace/history" className="text-sm text-purple-600 hover:underline flex items-center">
          View all
          <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
      
      <ScrollArea className="w-full whitespace-nowrap pb-4">
        <div className="flex gap-4">
          {recentlyViewed.slice(0, 8).map((item) => (
            <Link 
              key={item.id} 
              to={`/marketplace?productId=${item.id}`} 
              className={cn(
                "inline-block rounded-md border border-gray-200 overflow-hidden hover:shadow-md transition-all bg-white",
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
        <div className="mt-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold">You Might Also Like</h2>
              <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">Based on your browsing</Badge>
            </div>
            <Link to="/marketplace" className="text-sm text-purple-600 hover:underline flex items-center">
              Explore more
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          <ScrollArea className="w-full whitespace-nowrap pb-4">
            <div className="flex gap-4">
              {recommendations.slice(0, 8).map((product) => (
                <Link 
                  key={product.product_id || product.id} 
                  to={`/marketplace?productId=${product.product_id || product.id}`} 
                  className={cn(
                    "inline-block rounded-md border border-gray-200 overflow-hidden hover:shadow-md transition-all bg-gradient-to-b from-white to-amber-50",
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
                    <div className="absolute top-2 right-2">
                      <div className="bg-amber-100 text-amber-700 text-xs font-medium px-1.5 py-0.5 rounded">
                        Recommended
                      </div>
                    </div>
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
