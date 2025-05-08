import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

interface ProductCardProps {
  product: any;
  isWishlisted?: boolean;
  isGifteeView?: boolean;
  onToggleWishlist?: () => void;
  onClick?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted = false,
  isGifteeView = true, 
  onToggleWishlist,
  onClick
}) => {
  const { addToRecentlyViewed } = useRecentlyViewed();
  
  const handleClick = () => {
    if (onClick) onClick();
    
    // Track this product as recently viewed
    addToRecentlyViewed({
      id: product.product_id || product.id || "",
      name: product.title || product.name || "",
      image: product.image || "",
      price: product.price
    });
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all relative group hover:shadow-md cursor-pointer border-2",
        isWishlisted && "border-pink-200 hover:border-pink-300",
        !isWishlisted && "hover:border-gray-300"
      )}
      onClick={handleClick}
    >
      <div className="aspect-square relative overflow-hidden">
        <img 
          src={product.image || "/placeholder.svg"} 
          alt={product.name || product.title || "Product"} 
          className="object-cover w-full h-full transition-transform group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
        
        {isGifteeView && (
          <button 
            className={cn(
              "absolute top-2 right-2 p-1 rounded-full transition-colors",
              isWishlisted 
                ? "bg-pink-100 text-pink-500 hover:bg-pink-200" 
                : "bg-white/80 text-gray-400 hover:text-pink-500 hover:bg-white"
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleWishlist) onToggleWishlist();
            }}
          >
            <Heart className={cn("h-5 w-5", isWishlisted && "fill-pink-500")} />
          </button>
        )}
      </div>
      
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
          {product.name || product.title}
        </h3>
        
        <div className="mt-2 flex justify-between items-center">
          <div className="font-semibold">
            ${product.price?.toFixed(2)}
          </div>
          
          {product.rating && (
            <div className="flex items-center text-xs text-amber-500">
              <span className="mr-1">★</span>
              <span>{product.rating}</span>
              {product.reviewCount && (
                <span className="text-gray-400 ml-1">({product.reviewCount})</span>
              )}
            </div>
          )}
        </div>
        
        {product.tags && product.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.tags.slice(0, 1).map((tag: string, i: number) => (
              <span 
                key={i} 
                className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProductCard;
