import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/product";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Heart, Minus, Plus, Gift, Share2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuickWishlist } from "@/hooks/useQuickWishlist";
import AddToCartButton from "./components/AddToCartButton";

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
  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [activeTab, setActiveTab] = useState("product");

  // Use our wishlist hook
  const { 
    toggleWishlist, 
    isFavorited,
    showSignUpDialog,
    setShowSignUpDialog
  } = useQuickWishlist();
  
  // Handle quantity changes
  const increaseQuantity = () => {
    setQuantity(prev => Math.min(prev + 1, 10)); // Limit to 10 items
  };
  
  const decreaseQuantity = () => {
    setQuantity(prev => Math.max(prev - 1, 1)); // Minimum 1 item
  };
  
  if (!product) return null;

  const productId = product.product_id || product.id || "";
  
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(e, {
      id: productId,
      name: product.title || product.name || "",
      image: product.image,
      price: product.price
    });
  };

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
          {/* Product Image */}
          <div className="h-[250px] md:h-[500px] bg-muted relative overflow-hidden">
            {product.image && (
              <img 
                src={product.image} 
                alt={product.title || product.name || "Product"} 
                className="w-full h-full object-cover"
              />
            )}

            {/* Badges */}
            <div className="absolute top-2 left-2 space-x-2">
              {product.tags?.includes("bestseller") && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200">Best Seller</Badge>
              )}
              {product.tags?.includes("new") && (
                <Badge className="bg-green-100 text-green-800 border-green-200">New</Badge>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="absolute top-2 right-2 flex space-x-1">
              <Button 
                variant="secondary" 
                size="icon" 
                className="rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
                onClick={handleWishlistToggle}
              >
                <Heart 
                  className={`h-4 w-4 ${isFavorited(productId) ? 'fill-red-500 text-red-500' : ''}`}
                />
              </Button>
              
              <Button 
                variant="secondary" 
                size="icon" 
                className="rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
                onClick={handleShareProduct}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Product Details */}
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
            
            {/* REMOVE GIFT OPTIONS TAB - Save code for later */}
            {/* 
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="product">Product Details</TabsTrigger>
                <TabsTrigger value="gift">Gift Options</TabsTrigger>
              </TabsList>
              
              <TabsContent value="product">
            */}
            {/* Instead, just render the product details section directly */}
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
            
            {/* </TabsContent> */}
            {/* -- Gift Options Tab removed until future */}
            {/* </Tabs> */}
            
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="quantity">Quantity</Label>
                <div className="flex items-center border rounded-md">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-r-none"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <div className="w-8 text-center">{quantity}</div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-l-none"
                    onClick={increaseQuantity}
                    disabled={quantity >= 10}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <AddToCartButton 
                  product={product}
                  className="flex-1"
                  quantity={quantity}
                />
                
                <Button 
                  variant="secondary" 
                  onClick={handleWishlistToggle}
                  className={isFavorited(productId) ? "bg-pink-50" : ""}
                >
                  <Heart 
                    className={`h-4 w-4 mr-2 ${isFavorited(productId) ? 'fill-pink-500 text-pink-500' : ''}`} 
                  />
                  {isFavorited(productId) ? "Wishlisted" : "Add to Wishlist"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;
