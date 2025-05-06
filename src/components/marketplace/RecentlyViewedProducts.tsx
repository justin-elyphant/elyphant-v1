
import React from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, X } from "lucide-react";
import { formatDistance } from "date-fns";
import { useNavigate } from "react-router-dom";

const RecentlyViewedProducts = () => {
  const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed();
  const navigate = useNavigate();
  
  if (recentlyViewed.length === 0) return null;
  
  return (
    <div className="py-6 border-t">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-lg font-medium">Recently Viewed</h3>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={clearRecentlyViewed}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
      
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4 pb-4">
          {recentlyViewed.map((item) => (
            <Card 
              key={item.id} 
              className="min-w-[160px] max-w-[160px] cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/marketplace?productId=${item.id}`)}
            >
              <div className="aspect-square w-full overflow-hidden">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              </div>
              <CardContent className="p-3">
                <p className="text-xs font-medium line-clamp-1">{item.name}</p>
                {item.price && (
                  <p className="text-xs font-semibold">${item.price.toFixed(2)}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistance(item.viewedAt, Date.now(), { addSuffix: true })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default RecentlyViewedProducts;
