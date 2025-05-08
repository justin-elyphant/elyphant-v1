
import React from "react";
import { Activity, Clock, ShoppingBag } from "lucide-react";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { RecentlyViewedProduct } from "@/types/supabase";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const ActivityTabContent = () => {
  const { profile } = useProfile();
  const recentlyViewed = profile?.recently_viewed || [];
  
  if (!recentlyViewed.length) {
    return (
      <div className="text-center py-8 border rounded-lg">
        <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
        <h4 className="font-medium">No recent activity</h4>
        <p className="text-sm text-muted-foreground mt-1">
          Recent activity will appear here.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Recently Viewed Products</h3>
        <Link to="/marketplace" className="text-sm text-blue-600 hover:text-blue-800">
          View all products
        </Link>
      </div>
      
      <div className="space-y-2 divide-y">
        {recentlyViewed.slice(0, 10).map((product, index) => (
          <div key={`${product.id}-${index}`} className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="w-6 h-6 m-3 text-gray-400" />
                )}
              </div>
              <div>
                <Link 
                  to={`/marketplace?productId=${product.id}`} 
                  className="font-medium hover:text-blue-600 line-clamp-1"
                >
                  {product.name}
                </Link>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {product.viewed_at ? (
                    format(new Date(product.viewed_at), "MMM d, yyyy")
                  ) : (
                    "Recently"
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              {product.price ? (
                <span className="font-medium">${product.price.toFixed(2)}</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityTabContent;
