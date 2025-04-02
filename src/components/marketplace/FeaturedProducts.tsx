
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const FeaturedProducts = () => {
  // Simulated featured products - in a real app, this would come from an API
  const products = [
    {
      id: 1,
      name: "Premium Headphones",
      price: 149.99,
      image: "https://placehold.co/300x300/e2e8f0/64748b?text=Headphones",
      vendor: "Audio Shop",
      sponsored: true,
    },
    {
      id: 2,
      name: "Smart Watch Series 5",
      price: 299.99,
      image: "https://placehold.co/300x300/e2e8f0/64748b?text=Watch",
      vendor: "Tech Store",
      sponsored: true,
    },
    {
      id: 3,
      name: "Wireless Earbuds",
      price: 89.99,
      image: "https://placehold.co/300x300/e2e8f0/64748b?text=Earbuds",
      vendor: "Audio Shop",
      sponsored: false,
    },
    {
      id: 4,
      name: "Fitness Tracker",
      price: 79.99,
      image: "https://placehold.co/300x300/e2e8f0/64748b?text=Tracker",
      vendor: "Health Gadgets",
      sponsored: false,
    }
  ];

  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Featured Products</h2>
        <a href="#" className="text-primary hover:underline text-sm">View all</a>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="relative">
              <AspectRatio ratio={1 / 1}>
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="object-cover w-full h-full"
                />
              </AspectRatio>
              {product.sponsored && (
                <Badge 
                  className="absolute top-2 right-2 bg-primary/80"
                  variant="secondary"
                >
                  Sponsored
                </Badge>
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-medium mb-1 line-clamp-1">{product.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{product.vendor}</p>
              <p className="font-semibold">${product.price.toFixed(2)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FeaturedProducts;
