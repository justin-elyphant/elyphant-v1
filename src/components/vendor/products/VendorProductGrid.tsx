import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { VendorProduct } from "@/hooks/vendor/useVendorProducts";

interface VendorProductGridProps {
  products: VendorProduct[];
}

export const VendorProductGrid = ({ products }: VendorProductGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <div className="aspect-square bg-muted flex items-center justify-center">
            {product.image_url ? (
              <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <Package className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <CardContent className="p-4 space-y-2">
            <h3 className="font-medium text-sm line-clamp-2">{product.title}</h3>
            <div className="flex items-center justify-between">
              <span className="font-semibold">${product.price?.toFixed(2) ?? "—"}</span>
              {product.category && (
                <Badge variant="secondary" className="text-xs">{product.category}</Badge>
              )}
            </div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>{product.view_count ?? 0} views</span>
              <span>·</span>
              <span>{product.purchase_count ?? 0} sales</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
