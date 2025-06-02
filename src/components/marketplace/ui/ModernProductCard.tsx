
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/product";
import { useAuth } from "@/contexts/auth";
import { useQuickWishlist } from "@/hooks/useQuickWishlist";
import QuickWishlistButton from "../product-item/QuickWishlistButton";
import SignUpDialog from "../SignUpDialog";

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
  const { toggleWishlist, showSignUpDialog, setShowSignUpDialog } = useQuickWishlist();

  const productId = String(product.product_id || product.id);
  const productName = product.title || product.name || "";

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      setShowSignUpDialog(true);
      return;
    }

    const productInfo = {
      id: productId,
      name: productName,
      image: product.image,
      price: product.price,
      brand: product.brand
    };

    await toggleWishlist(e, productInfo);
    onToggleFavorite(e);
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
            <div className="absolute top-3 right-3">
              <QuickWishlistButton
                productId={productId}
                isFavorited={isFavorited}
                onClick={handleWishlistClick}
                size="md"
                variant="floating"
              />
            </div>

            {/* Quick Add to Cart */}
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                size="sm"
                onClick={onAddToCart}
                className="rounded-full shadow-lg"
              >
                <ShoppingBag className="w-4 h-4" />
              </Button>
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
              ${product.price?.toFixed(2) || "0.00"}
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
