
import React from "react";
import { Product } from "@/types/product";
import { Star, Heart, Share, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

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
  const getPriceFormatOptions = () => ({
    productSource: product.productSource || (product.isZincApiProduct ? 'zinc_api' : 'manual'),
    skipCentsDetection: product.skipCentsDetection || false
  });

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
    <div className="card-unified cursor-pointer group">
      {/* Image Container with Overlay Actions */}
      <div className="relative aspect-square surface-sunken overflow-hidden cursor-pointer" onClick={onClick}>
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
        
        {/* Best Seller Badge */}
        {product.isBestSeller && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
            Best Seller
          </div>
        )}
        
        {/* Action Buttons Overlay - Heart and Share */}
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
      <div className="touch-padding space-y-tight">
        {/* Brand Name - Prominent at top */}
        {(product.brand || product.vendor) && (
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            {product.brand || product.vendor}
          </p>
        )}
        
        {/* Rating */}
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span>{formatRating(product.rating || 0)}</span>
          {product.reviewCount && (
            <span className="text-gray-500">({product.reviewCount})</span>
          )}
        </div>
        
        {/* Title */}
        <div onClick={onClick} className="cursor-pointer">
          <h3 className="text-body-sm font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">
            {product.title}
          </h3>
        </div>
        
        {/* Variant Count Badge (like Amazon "15 colors") */}
        {product.variant_count && product.variant_count > 1 && (
          <p className="text-xs text-muted-foreground">
            {product.variant_count} options available
          </p>
        )}
        
        {/* Price and Action Icons */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-foreground">
            {formatPrice(product.price, getPriceFormatOptions())}
          </span>
          
          {/* Styled Action Icons - Share and Cart */}
          <div className="flex items-center gap-2">
            <button
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
              onClick={handleShare}
            >
              <Share className="h-4 w-4" />
            </button>
            <button
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-full hover:bg-gray-800 transition-colors"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-3 w-3" />
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
