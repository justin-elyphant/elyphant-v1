
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Star } from "lucide-react";

const VendorList = () => {
  // Simulated vendor data - in a real app, this would come from an API
  const vendors = [
    {
      id: 1,
      name: "Shopify Store A",
      type: "Shopify",
      productCount: 1250,
      rating: 4.7,
      description: "High-quality electronics and accessories",
    },
    {
      id: 2,
      name: "Amazon Products via Zinc",
      type: "Amazon (Zinc)",
      productCount: 5000,
      rating: 4.8,
      description: "Wide selection of products from Amazon's marketplace",
    },
    {
      id: 3,
      name: "Fashion Outlet",
      type: "Direct API",
      productCount: 890,
      rating: 4.5,
      description: "Trendy clothing and accessories for all seasons",
    },
    {
      id: 4,
      name: "Home Goods",
      type: "Shopify",
      productCount: 760,
      rating: 4.6,
      description: "Everything you need for your home and garden",
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Connected Vendors</h2>
        <a href="/vendor-management" className="text-primary hover:underline text-sm">Manage vendors</a>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vendors.map((vendor) => (
          <Card key={vendor.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{vendor.name}</CardTitle>
                <Badge variant="outline">{vendor.type}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{vendor.description}</p>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-1">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  <span>{vendor.productCount.toLocaleString()} products</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{vendor.rating}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VendorList;
