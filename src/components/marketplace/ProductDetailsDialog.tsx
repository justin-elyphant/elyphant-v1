
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Product } from "@/contexts/ProductContext";
import { useCart } from "@/contexts/CartContext";
import { Heart, ShoppingCart, Star, StarHalf } from "lucide-react";
import { toast } from "sonner";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";

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

  // Safely access images array or create a single-item array from image if images is undefined
  const images = product.images && product.images.length > 0 ? product.images : [product.image];

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

  // Create a function to render the carousel
  const renderCarousel = () => {
    if (images.length === 1) {
      return (
        <div className="aspect-square relative">
          <img 
            src={images[0]} 
            alt={product.name}
            className="w-full h-full object-cover rounded-md"
          />
        </div>
      );
    }

    return (
      <Carousel className="w-full">
        <CarouselContent>
          {images.map((img, idx) => (
            <CarouselItem key={idx}>
              <div className="aspect-square relative">
                <img 
                  src={img} 
                  alt={`${product.name} view ${idx + 1}`}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{product.name}</DialogTitle>
          {product.description && (
            <DialogDescription className="text-sm text-muted-foreground line-clamp-2">
              {product.description.substring(0, 120)}{product.description.length > 120 ? '...' : ''}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="relative overflow-hidden rounded-md">
            {renderCarousel()}
          </div>
          
          <div className="flex flex-col space-y-4">
            <div>
              <h3 className="text-2xl font-bold">${product.price.toFixed(2)}</h3>
              {renderRating(product.rating, product.reviewCount)}
              <span className="text-green-600 text-sm block mt-2">Free shipping</span>
            </div>
            
            <div className="space-y-4">
              {product.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </div>
              )}

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
              
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Specifications</h4>
                  <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-2">
                    {Object.entries(product.specifications).map(([key, value], idx) => (
                      <React.Fragment key={idx}>
                        <span className="text-muted-foreground">{key}:</span>
                        <span>{value}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-auto pt-4 flex flex-col space-y-2">
              <Button 
                onClick={() => {
                  addToCart(product);
                  toast.success("Product added to cart!");
                }}
                className="w-full"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              
              {userData && (
                <Button variant="outline" className="w-full">
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
