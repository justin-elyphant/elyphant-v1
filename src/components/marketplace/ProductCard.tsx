
import React from "react";
import { Product } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, Share } from "lucide-react";
import AddToCartButton from "./components/AddToCartButton";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  statusBadge?: { badge: string; color: string } | null;
  onAddToCart?: (product: Product) => void;
  onShare?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onClick, 
  statusBadge,
  onAddToCart,
  onShare 
}) => {
  const formatPrice = (price: number) => {
    // Convert cents to dollars if price is in cents
    const actualPrice = price > 1000 ? price / 100 : price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(actualPrice);
  };

  const formatRating = (rating: number) => {
    return Math.round(rating * 10) / 10;
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(product);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement favorite functionality
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Image Container */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden cursor-pointer" onClick={onClick}>
        <img
          src={product.image || '/placeholder.svg'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder.svg';
          }}
        />
        
        {/* Status Badge */}
        {statusBadge && (
          <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium border ${statusBadge.color}`}>
            {statusBadge.badge}
          </div>
        )}
        
        {/* Action Buttons Overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-white/90 hover:bg-white border-gray-200"
            onClick={handleFavorite}
          >
            <Heart className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-white/90 hover:bg-white border-gray-200"
            onClick={handleShare}
          >
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Badges */}
        <div className="flex gap-2">
          {product.isBestSeller && (
            <Badge variant="secondary" className="text-xs">
              Best Seller
            </Badge>
          )}
        </div>
        
        {/* Title */}
        <div onClick={onClick} className="cursor-pointer">
          <h3 className="font-medium text-sm text-gray-900 line-clamp-2 hover:text-primary transition-colors">
            {product.title}
          </h3>
        </div>
        
        {/* Brand */}
        {product.brand && (
          <p className="text-xs text-gray-600 font-medium">{product.brand}</p>
        )}
        
        {/* Rating */}
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span>{formatRating(product.rating || 0)}</span>
          {product.reviewCount && (
            <span className="text-gray-500">({product.reviewCount})</span>
          )}
        </div>
        
        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-lg text-gray-900">
            {formatPrice(product.price)}
          </span>
        </div>
        
        {/* Add to Cart Button */}
        <AddToCartButton
          product={product}
          variant="default"
          size="sm"
          className="w-full"
          onClick={handleAddToCart}
        />
      </div>
    </div>
  );
};
