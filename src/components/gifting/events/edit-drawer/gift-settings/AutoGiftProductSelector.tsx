
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Gift } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/contexts/ProductContext";
import { Badge } from "@/components/ui/badge";
import { useZincSearch } from "@/hooks/useZincSearch";
import { Card, CardContent } from "@/components/ui/card";
import { formatProductPrice } from "@/components/marketplace/product-item/productUtils";

interface AutoGiftProductSelectorProps {
  onSelectProduct: (productId: string) => void;
  selectedProductId?: string;
}

const AutoGiftProductSelector: React.FC<AutoGiftProductSelectorProps> = ({ 
  onSelectProduct,
  selectedProductId
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { products } = useProducts();
  const { loading, filteredProducts } = useZincSearch(searchTerm);
  
  // Find the selected product
  const selectedProduct = selectedProductId ? 
    products.find(p => p.product_id === selectedProductId || p.id === selectedProductId) : 
    undefined;
  
  const handleProductSelect = (productId: string) => {
    onSelectProduct(productId);
    setOpen(false);
  };
  
  return (
    <>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Gift Product</label>
        {selectedProduct ? (
          <div className="flex items-center border rounded-lg p-2 bg-gray-50">
            <img 
              src={selectedProduct.image} 
              alt={selectedProduct.title || selectedProduct.name || ""}
              className="h-10 w-10 object-contain mr-2 rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {selectedProduct.title || selectedProduct.name}
              </p>
              <p className="text-xs text-muted-foreground">
                ${formatProductPrice(selectedProduct.price)}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              Change
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            className="w-full justify-start text-muted-foreground gap-2" 
            onClick={() => setOpen(true)}
          >
            <Gift className="h-4 w-4" />
            <span>Select a gift product</span>
          </Button>
        )}
      </div>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select a Gift Product</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for a product..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="h-[300px] overflow-y-auto border rounded-md p-2">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading products...</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredProducts.map((product) => (
                    <Card 
                      key={product.product_id || product.id} 
                      className={`cursor-pointer hover:border-primary transition-colors ${
                        (product.product_id || product.id) === selectedProductId ? 
                          'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleProductSelect(product.product_id || product.id!)}
                    >
                      <CardContent className="p-3 flex items-center">
                        <img 
                          src={product.image} 
                          alt={product.title || product.name || ""}
                          className="h-12 w-12 object-contain mr-2 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">
                            {product.title || product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${formatProductPrice(product.price)}
                          </p>
                          {(product.category || product.category_name) && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {product.category || product.category_name}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-muted-foreground">No products found</p>
                  <p className="text-xs text-muted-foreground">Try a different search term</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AutoGiftProductSelector;
