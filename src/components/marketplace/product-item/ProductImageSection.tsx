
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Star, Eye } from "lucide-react";
import { Product } from "@/types/product";
import { getRandomMockProductImage } from "./mockProductImages";
import WishlistSelectionPopoverButton from "@/components/gifting/wishlist/WishlistSelectionPopoverButton";

interface ProductImageSectionProps {
  product: Product;
  viewMode: "grid" | "list";
  statusBadge?: { badge: string; color: string } | null;
  discountPercent: number | null;
  isFavorited: boolean;
  onWishlistClick: (e: React.MouseEvent) => void;
}

const ProductImageSection: React.FC<ProductImageSectionProps> = ({
  product,
  viewMode,
  statusBadge,
  discountPercent,
  isFavorited,
  onWishlistClick
}) => {
  const isListView = viewMode === "list";
  const imageClass = isListView 
    ? "w-24 h-24 xs:w-32 xs:h-32" 
    : "w-full aspect-square";

  // Use uploaded mock images for products that don't have real images
  const getProductImage = () => {
    if (product.image && !product.image.includes("placeholder")) {
      return product.image;
    }
    // Use product ID as seed for consistent image selection
    const seed = product.product_id ? 
      parseInt(product.product_id.replace(/\D/g, '').slice(-4) || '0') : 
      Math.floor(Math.random() * 1000);
    return getRandomMockProductImage(seed);
  };

  return (
    <div className={`relative overflow-hidden ${isListView ? 'flex-shrink-0' : ''}`}>
      <img
        src={getProductImage()}
        alt={product.title || product.name || "Product"}
        className={`${imageClass} object-cover bg-gray-100`}
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = "/placeholder.svg";
        }}
      />

      {/* Status Badge */}
      {statusBadge && (
        <Badge 
          className={`absolute top-2 left-2 ${statusBadge.color} text-white text-xs`}
        >
          {statusBadge.badge}
        </Badge>
      )}

      {/* Discount Badge */}
      {discountPercent && (
        <Badge className="absolute top-2 right-2 bg-red-500 text-white text-xs">
          -{discountPercent}%
        </Badge>
      )}

      {/* Wishlist Button - Top Right for Grid, Top Left for List */}
      <div 
        className={`absolute ${isListView ? 'top-2 left-2' : 'top-2 right-2'} z-10`}
        onClick={onWishlistClick}
      >
        <WishlistSelectionPopoverButton
          product={{
            id: String(product.product_id || product.id),
            name: product.title || product.name || "",
            image: product.image || "",
            price: product.price,
            brand: product.brand || product.vendor
          }}
          triggerClassName={`p-1.5 rounded-full transition-colors ${
            isFavorited 
              ? "bg-pink-100 text-pink-500 hover:bg-pink-200" 
              : "bg-white/80 text-gray-400 hover:text-pink-500 hover:bg-white"
          }`}
        />
      </div>

      {/* Recently Viewed Badge */}
      {product.recentlyViewed && (
        <Badge className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs flex items-center gap-1">
          <Eye className="h-3 w-3" />
          Recently Viewed
        </Badge>
      )}

      {/* Rating Badge for Grid View */}
      {!isListView && (product.rating || product.stars) && (
        <Badge className="absolute bottom-2 right-2 bg-yellow-500 text-white text-xs flex items-center gap-1">
          <Star className="h-3 w-3 fill-current" />
          {(product.rating || product.stars)?.toFixed(1)}
        </Badge>
      )}
    </div>
  );
};

export default ProductImageSection;
