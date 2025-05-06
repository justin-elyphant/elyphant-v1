
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductRating from "@/components/shared/ProductRating";
import { formatProductPrice } from "../product-item/productUtils";

interface ModernProductCardProps {
  product: any;
  isFavorited: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onAddToCart: (e: React.MouseEvent) => void;
  onClick: () => void;
}

const ModernProductCard = ({
  product,
  isFavorited,
  onToggleFavorite,
  onAddToCart,
  onClick
}: ModernProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Extract necessary product details
  const productName = product.title || product.name || "";
  const productPrice = product.price || 0;
  const productImage = product.image || "/placeholder.svg";
  const rating = product.rating || product.stars || 0;
  const reviewCount = product.reviewCount || product.num_reviews || 0;
  
  return (
    <Card 
      className="overflow-hidden transition-all duration-300 hover:shadow-lg relative group cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image with zoom effect */}
      <div className="aspect-square overflow-hidden relative">
        <img
          src={productImage}
          alt={productName}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isHovered ? "scale-110" : "scale-100"
          }`}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
        
        {/* Quick action buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full shadow-md bg-white hover:bg-white/90"
            onClick={onToggleFavorite}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
          
          <Button
            size="icon"
            variant="secondary" 
            className="h-8 w-8 rounded-full shadow-md bg-white hover:bg-white/90"
            onClick={onAddToCart}
            aria-label="Add to cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Badges */}
        {product.isBestSeller && (
          <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
            Best Seller
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4 relative z-10">
        {/* Product info */}
        <h3 className="font-medium text-sm line-clamp-1">{productName}</h3>
        
        <ProductRating rating={rating} reviewCount={reviewCount} size="sm" />
        
        <div className="flex justify-between items-center mt-2">
          <p className="font-semibold">${formatProductPrice(productPrice)}</p>
          
          {/* View details link */}
          <span className={`text-xs text-primary underline transform transition-transform duration-300 ${
            isHovered ? "translate-x-1" : ""
          }`}>
            View details
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernProductCard;
