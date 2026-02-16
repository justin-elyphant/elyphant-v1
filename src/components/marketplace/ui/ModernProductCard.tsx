
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/product";
import { useAuth } from "@/contexts/auth";
import WishlistSelectionPopoverButton from "@/components/gifting/wishlist/WishlistSelectionPopoverButton";
import SignUpDialog from "../SignUpDialog";
import { formatPrice } from "@/lib/utils";

interface ModernProductCardProps {
  product: Product;
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
  onClick,
}: ModernProductCardProps) => {
  const { user } = useAuth();
  const [showSignUpDialog, setShowSignUpDialog] = React.useState(false);

  const productId = String(product.product_id || product.id);
  const productName = product.title || product.name || "";

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      setShowSignUpDialog(true);
      return;
    }
  };

  const handleWishlistAdded = () => {
    onToggleFavorite({} as React.MouseEvent);
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onAddToCart(e);
  };

  return (
    <>
      <Card 
        className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden border-0 bg-white/90 backdrop-blur-sm"
        onClick={onClick}
      >
        <div className="relative">
          {/* Product Image */}
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
            {product.image ? (
              <img
                src={product.image}
                alt={productName}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ShoppingBag className="w-12 h-12" />
              </div>
            )}
          </div>

          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300">
            {/* Wishlist Button */}
            <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
              {user ? (
                <WishlistSelectionPopoverButton
                  variant="icon"
                  product={{
                    id: productId,
                    name: productName,
                    image: product.image,
                    price: product.price,
                    brand: product.brand
                  }}
                  triggerClassName="p-1.5 bg-white/80 hover:bg-white text-gray-400 hover:text-pink-500 rounded-full transition-colors"
                  onAdded={handleWishlistAdded}
                />
              ) : (
                <button
                  className="p-1.5 bg-white/80 hover:bg-white text-gray-400 hover:text-pink-500 rounded-full transition-colors"
                  onClick={handleWishlistClick}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Quick Add to Cart */}
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={handleAddToCartClick}
                className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-full hover:bg-gray-800 transition-colors shadow-lg"
              >
                <ShoppingBag className="w-3 h-3 mr-1" />
                Add
              </button>
            </div>
          </div>

          {/* Badges */}
          {product.tags?.includes("bestseller") && (
            <Badge className="absolute top-3 left-3 bg-amber-500 text-white">
              Best Seller
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {productName}
          </h3>
          
          {product.brand && (
            <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
          </div>
        </CardContent>
      </Card>

      <SignUpDialog 
        open={showSignUpDialog} 
        onOpenChange={setShowSignUpDialog} 
      />
    </>
  );
};

export default ModernProductCard;
