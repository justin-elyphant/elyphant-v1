
import React from "react";
import { useProducts } from "@/contexts/ProductContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const ZincProductsTab = () => {
  const { products } = useProducts();
  const amazonProducts = products.filter(p => p.vendor === "Amazon via Zinc");
  
  return (
    <div className="space-y-4 py-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search Amazon products..."
          className="pl-8"
        />
      </div>
      
      {amazonProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <p className="text-center text-muted-foreground">
              No Amazon products found. Sync with Amazon to import products.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {amazonProducts.map(product => (
            <Card key={product.id}>
              <CardContent className="p-4 flex gap-4">
                <div className="w-20 h-20 rounded overflow-hidden shrink-0">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
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
      )}
    </div>
  );
};

export default ZincProductsTab;
