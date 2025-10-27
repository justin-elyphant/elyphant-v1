import React from "react";
import { Product } from "@/contexts/ProductContext";
import { Sparkles } from "lucide-react";
import { Wishlist } from "@/types/profile";
import AirbnbStyleProductCard from "@/components/marketplace/AirbnbStyleProductCard";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface MarketplaceProductsSectionProps {
  products: Product[];
  wishlists: Wishlist[];
  onCreateWishlist: () => void;
  isLoading?: boolean;
  mode?: 'browse' | 'recommended';
  title?: string;
}

const MarketplaceProductsSection: React.FC<MarketplaceProductsSectionProps> = ({
  products,
  wishlists,
  onCreateWishlist,
  isLoading,
  mode = 'browse',
  title
}) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const displayTitle = title || (mode === 'recommended' ? 'Recommended for You' : 'Browse Products');

  const handleProductClick = (product: Product) => {
    // Pass product data via navigation state to avoid edge function dependency
    navigate(`/marketplace/product/${product.product_id || product.id}`, {
      state: { product }
    });
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    toast.success(`${product.title || product.name} added to cart`);
  };

  const handleShare = (product: Product) => {
    // Share functionality handled by AirbnbStyleProductCard
    console.log('Share product:', product);
  };
  if (isLoading) {
    return (
      <div className="py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="space-y-3 animate-pulse">
              <div className="aspect-square bg-muted rounded-lg" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className={mode === 'recommended' ? 'text-xl font-semibold' : 'text-2xl font-bold'}>
          {displayTitle}
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {products.slice(0, 20).map((product) => (
          <AirbnbStyleProductCard
            key={product.product_id || product.id}
            product={product}
            onProductClick={() => handleProductClick(product)}
            onAddToCart={handleAddToCart}
            onShare={handleShare}
          />
        ))}
      </div>
    </div>
  );
};

export default MarketplaceProductsSection;
