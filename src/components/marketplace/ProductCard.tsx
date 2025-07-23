
import React from "react";
import { Product } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatRating = (rating: number) => {
    return Math.round(rating * 10) / 10;
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-square mb-3 bg-gray-100 rounded-md overflow-hidden">
        <img
          src={product.image || '/placeholder.svg'}
          alt={product.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder.svg';
          }}
        />
      </div>
      
      <div className="space-y-2">
        {product.isBestSeller && (
          <Badge variant="secondary" className="text-xs">
            Best Seller
          </Badge>
        )}
        
        <h3 className="font-medium text-sm text-gray-900 line-clamp-2">
          {product.title}
        </h3>
        
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span>{formatRating(product.rating || 0)}</span>
          {product.reviewCount && (
            <span className="text-gray-500">({product.reviewCount})</span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">
            {formatPrice(product.price)}
          </span>
          {product.brand && (
            <span className="text-xs text-gray-500">{product.brand}</span>
          )}
        </div>
      </div>
    </div>
  );
};
