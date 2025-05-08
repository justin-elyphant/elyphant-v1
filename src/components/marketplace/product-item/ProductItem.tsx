import React from "react";
import { Product } from "@/contexts/ProductContext";
import ProductImage from "./ProductImage";
import ProductRating from "./ProductRating";
import ProductDetails from "./ProductDetails";
import WishlistButton from "./WishlistButton";
import { useAuth } from "@/contexts/auth";
import { useFavorites, SavedItemType } from "@/components/gifting/hooks/useFavorites";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Truck, Award } from "lucide-react";

interface ProductItemProps {
  product: Product;
  viewMode: "grid" | "list";
  onProductClick: (productId: string) => void;
  onWishlistClick: (e: React.MouseEvent) => void;
  isFavorited: boolean;
}

const ProductItem = ({ 
  product, 
  viewMode, 
  onProductClick,
  onWishlistClick,
  isFavorited 
}: ProductItemProps) => {
  const { user } = useAuth();
  const { handleSaveOptionSelect } = useFavorites();

  const handleSaveOption = (option: SavedItemType, productId: string) => {
    handleSaveOptionSelect(option, productId);
  };

  // Generate product badges based on product metadata
  const getBadges = () => {
    const badges = [];
    
    // Check for popularity or bestseller status
    if (product.stars && product.stars >= 4.5) {
      badges.push({
        text: "Popular Pick",
        variant: "default",
        className: "bg-purple-600"
      });
    }
    
    // Check for fast delivery
    if (product.prime) {
      badges.push({
        text: "Fast Delivery",
        variant: "secondary",
        className: "bg-green-600"
      });
    }
    
    // Check for staff favorites
    if (product.stars && product.stars >= 4.8) {
      badges.push({
        text: "Staff Favorite",
        variant: "outline",
        className: "border-amber-500 text-amber-600"
      });
    }
    
    // Ensure we always show at least one badge
    if (badges.length === 0) {
      const categories = ['Birthdays', 'Holidays', 'Anniversaries', 'Celebrations'];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      
      badges.push({
        text: `Great for ${randomCategory}`,
        variant: "outline",
        className: "border-blue-300 text-blue-600"
      });
    }
    
    return badges.slice(0, 1); // Only return first badge to avoid cluttering
  };

  return (
    <div 
      className={`group relative rounded-lg overflow-hidden border ${
        viewMode === 'grid' ? 'h-full flex flex-col' : 'flex'
      } bg-white hover:shadow-md transition-all duration-300 hover:-translate-y-1`}
      onClick={() => onProductClick(product.product_id)}
      data-testid={`product-item-${product.product_id}`}
    >
      <div className={viewMode === 'grid' ? 'relative' : 'w-1/4'}>
        <ProductImage 
          product={product} 
        />
        <WishlistButton 
          userData={user}
          productId={product.product_id}
          productName={product.title}
          onWishlistClick={onWishlistClick}
          onSaveOptionSelect={handleSaveOption}
          isFavorited={isFavorited}
        />
        
        {/* Product Badge */}
        <div className="absolute top-2 left-2 z-10">
          {getBadges().map((badge, index) => (
            <Badge 
              key={index} 
              variant={badge.variant as any} 
              className={`${badge.className} text-xs text-white`}
            >
              {badge.text}
            </Badge>
          ))}
        </div>
      </div>
      
      <ProductDetails 
        product={product} 
        onAddToCart={(e) => {
          e.stopPropagation();
          // We'll handle this in ProductDetails
          console.log("Gift This:", product.product_id);
        }}
      />
      
      {/* Trust elements */}
      <div className="absolute bottom-0 left-0 w-full px-4 py-2 bg-gradient-to-t from-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-4 text-xs text-slate-700">
          <div className="flex items-center">
            <Truck className="h-3 w-3 mr-1 text-green-600" />
            <span>Free Shipping</span>
          </div>
          
          <div className="flex items-center">
            <CheckCircle2 className="h-3 w-3 mr-1 text-blue-600" />
            <span>Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductItem;
