
import React from "react";
import { useRecentlyViewedProducts } from "./hooks/useRecentlyViewedProducts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const RecentlyViewedProducts = () => {
  const { recentProducts } = useRecentlyViewedProducts();
  
  // Don't display if no recently viewed products
  if (!recentProducts || recentProducts.length === 0) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Recently Viewed</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {recentProducts.slice(0, 6).map((product) => (
            <Link 
              key={product.product_id || product.id} 
              to={`/marketplace?productId=${product.product_id || product.id}`}
              className="block"
            >
              <div className="group cursor-pointer">
                <div className="aspect-square overflow-hidden rounded-md border bg-gray-100">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.title || product.name || "Product"}
                    className="h-full w-full object-cover object-center transition-transform group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                </div>
                <div className="mt-2">
                  <div className="text-sm font-medium line-clamp-1">
                    {product.title || product.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentlyViewedProducts;
