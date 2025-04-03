
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Product } from "@/contexts/ProductContext";
import { useCart } from "@/contexts/CartContext";
import { Heart, ShoppingCart, Star, StarHalf, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!product) return null;

  const images = Array.isArray(product.images) ? product.images : [product.image];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const renderRating = (rating?: number, reviewCount?: number) => {
    if (!rating) return null;
    
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
            <div className="aspect-square relative">
              <img 
                src={images[currentImageIndex]} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full"
                    onClick={previousImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`w-16 h-16 rounded-md overflow-hidden border-2 ${
                      idx === currentImageIndex ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => setCurrentImageIndex(idx)}
                  >
                    <img
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex flex-col space-y-4">
            <div>
              <h3 className="text-2xl font-bold">${product.price.toFixed(2)}</h3>
              {renderRating(product.rating, product.reviewCount)}
              <span className="text-green-600 text-sm block mt-2">Free shipping</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </div>

              {product.features && product.features.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Features</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {product.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
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
