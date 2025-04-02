
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Award } from "lucide-react";

const SponsoredSection = () => {
  // Simulated sponsored content - in a real app, this would come from an API
  const sponsoredVendors = [
    {
      id: 1,
      name: "Premium Shop",
      description: "Featured vendor with top-rated products",
      metrics: { sales: 4250, rating: 4.8 },
      sponsored: true,
      featured: true,
    },
    {
      id: 2,
      name: "Trending Store",
      description: "Popular items at competitive prices",
      metrics: { sales: 3800, rating: 4.6 },
      sponsored: true,
      featured: false,
    }
  ];

  return (
    <Card className="overflow-hidden">
      <div className="bg-primary/10 px-4 py-2 flex items-center justify-between">
        <h3 className="font-medium text-sm">Sponsored Vendors</h3>
        <Badge variant="outline" className="bg-primary/20">
          Featured
        </Badge>
      </div>
      <CardContent className="p-0">
        {sponsoredVendors.map((vendor) => (
          <div 
            key={vendor.id} 
            className="p-4 border-b last:border-0 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold flex items-center gap-1">
                  {vendor.name}
                  {vendor.featured && <Award className="h-4 w-4 text-amber-500" />}
                </h4>
                <p className="text-sm text-muted-foreground">{vendor.description}</p>
              </div>
              <div className="flex items-center text-sm">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span>{vendor.metrics.rating}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {vendor.metrics.sales.toLocaleString()} products sold
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SponsoredSection;
