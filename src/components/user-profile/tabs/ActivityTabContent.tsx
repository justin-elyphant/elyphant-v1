
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Profile } from "@/types/profile";

interface ActivityTabContentProps {
  profile: Profile | null;
  recentlyViewed: any[];
  isOwnProfile: boolean;
}

const ActivityTabContent: React.FC<ActivityTabContentProps> = ({ 
  profile, 
  recentlyViewed,
  isOwnProfile 
}) => {
  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Recently Viewed Products</CardTitle>
        </CardHeader>
        <CardContent>
          {recentlyViewed && recentlyViewed.length > 0 ? (
            <div className="space-y-4">
              {recentlyViewed.map((item) => (
                <div key={item.id} className="flex items-center gap-4 border-b pb-4">
                  <div className="h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {item.product_data?.image_url ? (
                      <img 
                        src={item.product_data.image_url} 
                        alt={item.product_data.title} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product_data.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="outline">${item.product_data.price?.toFixed(2) || 'N/A'}</Badge>
                      {item.product_data.brand && (
                        <Badge variant="secondary">{item.product_data.brand}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.viewed_at), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {isOwnProfile 
                ? "You haven't viewed any products recently."
                : "No recent activity to show."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityTabContent;
