
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, DollarSign, Package, ShoppingCart } from "lucide-react";

interface ProductOption {
  product_id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  retailer: string;
  rating: number;
  review_count: number;
  selected: boolean;
}

interface AutoGiftProductReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductOption[];
  totalBudget: number;
  eventType: string;
  onApprove: (selectedProductIds: string[]) => void;
  onReject: () => void;
}

const AutoGiftProductReview: React.FC<AutoGiftProductReviewProps> = ({
  open,
  onOpenChange,
  products,
  totalBudget,
  eventType,
  onApprove,
  onReject
}) => {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectedTotal = products
    .filter(product => selectedProducts.includes(product.product_id))
    .reduce((sum, product) => sum + product.price, 0);

  const handleApprove = () => {
    if (selectedProducts.length === 0) {
      return; // Don't approve if no products selected
    }
    onApprove(selectedProducts);
    onOpenChange(false);
  };

  const handleReject = () => {
    onReject();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Review Auto-Gift Suggestions for {eventType}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Budget summary */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Budget: ${totalBudget}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Selected total: </span>
              <Badge variant={selectedTotal > totalBudget ? "destructive" : "default"}>
                ${selectedTotal.toFixed(2)}
              </Badge>
            </div>
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card 
                key={product.product_id} 
                className={`cursor-pointer transition-all ${
                  selectedProducts.includes(product.product_id) 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-muted-foreground/50'
                }`}
                onClick={() => handleProductToggle(product.product_id)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Product image */}
                    <div className="relative">
                      <img 
                        src={product.image} 
                        alt={product.title}
                        className="w-full h-32 object-contain rounded"
                      />
                      <div className="absolute top-2 right-2">
                        <Checkbox
                          checked={selectedProducts.includes(product.product_id)}
                          onCheckedChange={() => handleProductToggle(product.product_id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {/* Product details */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                        {product.title}
                      </h4>
                      
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.rating > 0 && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{product.rating.toFixed(1)}</span>
                            <span>({product.review_count})</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                        <span>{product.retailer}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleReject}>
              Reject Auto-Gift
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Review Later
              </Button>
              <Button 
                onClick={handleApprove} 
                disabled={selectedProducts.length === 0 || selectedTotal > totalBudget}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Approve & Order ({selectedProducts.length} item{selectedProducts.length !== 1 ? 's' : ''})
              </Button>
            </div>
          </div>

          {selectedTotal > totalBudget && (
            <p className="text-sm text-destructive text-center">
              Selected total exceeds budget. Please remove some items.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutoGiftProductReview;
