
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description?: string;
}

interface ZincProductResultsProps {
  products: Product[];
  isLoading: boolean;
  searchTerm: string;
}

export const ZincProductResults = ({
  products,
  isLoading,
  searchTerm
}: ZincProductResultsProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <p className="text-center text-muted-foreground">
            No products found. Search for products or sync to import products.
          </p>
          <p className="text-center text-sm mt-2">
            Try searching for "San Diego Padres Hat" or "Nike Shoes" to see results.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {products.map(product => (
        <Card key={product.id}>
          <CardContent className="p-4 flex gap-4">
            <div className="w-20 h-20 rounded overflow-hidden shrink-0">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Replace broken images with placeholder
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium line-clamp-1">{product.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {product.description || "No description available."}
              </p>
              <p className="font-medium">${product.price.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
