
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, Search } from "lucide-react";
import ShareToConnectionButton from "./ShareToConnectionButton";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  brand: string;
}

interface ProductShareButtonProps {
  onShareProduct: (product: Product) => void;
}

const ProductShareButton = ({ onShareProduct }: ProductShareButtonProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Mock products for demo - in real app, this would come from API
  const mockProducts: Product[] = [
    { id: 1, name: "Wireless Headphones", price: 99.99, image: "/placeholder.svg", brand: "Sony" },
    { id: 2, name: "Smart Watch", price: 299.99, image: "/placeholder.svg", brand: "Apple" },
    { id: 3, name: "Coffee Maker", price: 79.99, image: "/placeholder.svg", brand: "Keurig" }
  ];

  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductSelect = (product: Product) => {
    onShareProduct(product);
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <Share2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products to share..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleProductSelect(product)}
              >
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{product.name}</h4>
                          <p className="text-xs text-muted-foreground">{product.brand}</p>
                          <p className="text-sm font-semibold text-primary">${product.price}</p>
                        </div>
                        <div className="ml-2">
                          <ShareToConnectionButton 
                            product={{
                              product_id: product.id.toString(),
                              id: product.id.toString(),
                              title: product.name,
                              name: product.name,
                              image: product.image,
                              price: product.price,
                              brand: product.brand
                            }}
                            variant="icon"
                            className="h-8 w-8"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredProducts.length === 0 && searchTerm && (
              <p className="text-center text-sm text-muted-foreground py-4">
                No products found
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProductShareButton;
