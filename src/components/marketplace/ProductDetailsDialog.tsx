import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/product";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Heart, Minus, Plus, Share2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductDetailsImageSection from "./product-details/ProductDetailsImageSection";
import ProductDetailsActionsSection from "./product-details/ProductDetailsActionsSection";

interface ProductDetailsDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: any;
}

const ProductDetailsDialog = ({ 
  product, 
  open, 
  onOpenChange, 
  userData 
}: ProductDetailsDialogProps) => {
  const [quantity, setQuantity] = useState(1);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [activeTab, setActiveTab] = useState("product");

  const increaseQuantity = () => {
    setQuantity(prev => Math.min(prev + 1, 10)); // Limit to 10 items
  };
  
  const decreaseQuantity = () => {
    setQuantity(prev => Math.max(prev - 1, 1)); // Minimum 1 item
  };
  
  if (!product) return null;

  const handleShareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title || product.name || "Check out this product",
        text: `Check out this product: ${product.title || product.name}`,
        url: window.location.href,
      });
    }
  };

  // Extract product features safely
  const productFeatures = Array.isArray(product.product_details) ? 
    product.product_details.map(detail => detail?.value || detail?.toString()) : 
    [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden max-h-[90vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Product Image & Actions Refactored */}
          <ProductDetailsImageSection
            product={product}
            isHeartAnimating={isHeartAnimating}
            onShare={handleShareProduct}
          />

          {/* Product Details Section */}
          <div className="p-6 overflow-y-auto max-h-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold mb-1">
                {product.title || product.name}
              </DialogTitle>
              
              <div className="flex items-center justify-between mt-2">
                <div className="text-lg font-bold">${product.price?.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">
                  {product.vendor && `By ${product.vendor}`}
                </div>
              </div>
            </DialogHeader>
            
            <Separator className="my-4" />
            
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                {product.description || "No description available for this product."}
              </p>
            </div>
            
            {productFeatures.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-2">Features</h4>
                <ul className="text-sm list-disc pl-4 space-y-1">
                  {productFeatures.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Refactored Actions Section */}
            <ProductDetailsActionsSection
              product={product}
              quantity={quantity}
              onIncrease={increaseQuantity}
              onDecrease={decreaseQuantity}
              isHeartAnimating={isHeartAnimating}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;
