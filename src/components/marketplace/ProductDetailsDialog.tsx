
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Product } from "@/contexts/ProductContext";
import { useCart } from "@/contexts/CartContext";
import { Heart, ShoppingCart, Star, StarHalf } from "lucide-react";
import { toast } from "sonner";

interface ProductDetailsDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: any | null;
}

const ProductDetailsDialog = ({ 
  product, 
  open, 
  onOpenChange,
  userData
}: ProductDetailsDialogProps) => {
  const { addToCart } = useCart();

  if (!product) return null;

  // Render star ratings
  const renderRating = (rating?: number, reviewCount?: number) => {
    if (!rating) return null;
    
    // Calculate full and half stars
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-1 mt-1">
        <div className="flex text-yellow-500">
          {[...Array(fullStars)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
          ))}
          {hasHalfStar && <StarHalf className="h-4 w-4 fill-yellow-500 text-yellow-500" />}
        </div>
        <span className="text-sm text-muted-foreground">
          {rating.toFixed(1)}
          {reviewCount && ` (${reviewCount})`}
        </span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="relative overflow-hidden rounded-md">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-auto object-cover"
            />
          </div>
          
          <div className="flex flex-col space-y-4">
            <div>
              <h3 className="text-2xl font-bold">${product.price.toFixed(2)}</h3>
              {renderRating(product.rating, product.reviewCount)}
              <span className="text-green-600 text-sm block mt-2">Free shipping</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">{product.description || "No product description available."}</p>
            </div>
            
            <div className="mt-auto pt-4 flex flex-col space-y-2">
              <Button 
                onClick={() => {
                  addToCart(product);
                  toast.success("Product added to cart!");
                }}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              
              {userData && (
                <Button variant="outline">
                  <Heart className="h-4 w-4 mr-2" />
                  Add to Wishlist
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;
