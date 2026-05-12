import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, Truck } from "lucide-react";
import { FullBleedSection } from "@/components/layout/FullBleedSection";
import { productCatalogService } from "@/services/ProductCatalogService";
import UnifiedProductCard from "@/components/marketplace/UnifiedProductCard";
import { Product } from "@/types/product";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/auth";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { toast } from "sonner";
import { triggerHapticFeedback } from "@/utils/haptics";
import { motion } from "framer-motion";

const CATEGORY_PATH = "/marketplace?category=gifts-in-a-hurry";

const PrimeGiftsInAHurryCTA = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { quickAddToWishlist } = useUnifiedWishlistSystem();
  const { addItem: addToRecentlyViewed } = useRecentlyViewed();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrimeProducts = async () => {
      try {
        setLoading(true);
        const response = await productCatalogService.searchProducts(
          "amazon prime fast shipping last minute gifts",
          { limit: 6 }
        );
        setProducts(response.products || []);
      } catch (error) {
        console.error("Error fetching prime products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPrimeProducts();
  }, []);

  const handleShopNow = () => {
    triggerHapticFeedback('light');
    navigate(CATEGORY_PATH);
  };

  const handleProductClick = (product: Product) => {
    triggerHapticFeedback('light');
    const productId = product.product_id || product.id;
    if (!productId) return;
    addToRecentlyViewed({
      id: String(productId),
      title: product.title || product.name || '',
      image: product.image || '',
      price: product.price || 0,
      brand: product.brand || ''
    });
    navigate(`/marketplace/product/${productId}`, {
      state: { product, context: 'prime', returnPath: location.pathname }
    });
  };

  const handleAddToCart = async (product: Product) => {
    triggerHapticFeedback('success');
    try {
      await addToCart(product, 1);
    } catch (error) {
      toast.error("Failed to add item to cart. Please try again.");
    }
  };

  const handleWishlist = async (product: Product) => {
    triggerHapticFeedback('success');
    if (!user) {
      navigate('/auth');
      return;
    }
    await quickAddToWishlist({
      id: String(product.product_id || product.id),
      name: product.name || product.title,
      title: product.title || product.name,
      image: product.image,
      price: product.price,
      brand: product.brand
    });
  };

  return (
    <FullBleedSection
      background="bg-gradient-to-r from-background via-muted/30 to-background"
      height="auto"
      className="py-16 sm:py-20 pb-safe"
    >
      {/* Header */}
      <div className="text-center space-y-6 mb-12">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Zap className="h-5 w-5" />
            <span className="text-sm font-medium">Powered by Amazon Prime</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Need a Gift{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              in a Hurry?
            </span>
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Last-minute? No problem. Shop our Prime-eligible picks with fast, free shipping — perfect for birthdays, holidays, and forgotten anniversaries.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4" />
            <span>Fast & Free Prime Shipping</span>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="relative">
        {loading ? (
          <>
            <div className="block md:hidden">
              <div className="grid grid-cols-2 gap-4 px-4 -mx-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
            <div className="hidden md:grid grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="block md:hidden">
              <div className="grid grid-cols-2 gap-4 px-4 -mx-4">
                {products.slice(0, 4).map((product) => (
                  <motion.div
                    key={product.product_id || product.id}
                    className="relative h-full min-h-[400px] touch-manipulation"
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="absolute top-2 left-2 z-10 bg-primary/95 text-primary-foreground text-xs px-2 py-1 rounded-md font-medium shadow-sm flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Prime
                    </div>
                    <UnifiedProductCard
                      cardType="gifting"
                      product={product}
                      isGifteeView={true}
                      onToggleWishlist={() => handleWishlist(product)}
                      onAddToCart={handleAddToCart}
                      onClick={() => handleProductClick(product)}
                      context="wishlist"
                      hideTopRightAction={true}
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="hidden md:block">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {products.slice(0, 6).map((product) => (
                  <motion.div
                    key={product.product_id || product.id}
                    className="relative h-80 touch-manipulation"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="absolute top-2 left-2 z-10 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Prime
                    </div>
                    <UnifiedProductCard
                      cardType="gifting"
                      product={product}
                      isGifteeView={true}
                      onToggleWishlist={() => handleWishlist(product)}
                      onAddToCart={handleAddToCart}
                      onClick={() => handleProductClick(product)}
                      context="wishlist"
                      hideTopRightAction={true}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* CTA */}
      <div className="text-center mt-12">
        <div className="space-y-4 mb-6">
          <h3 className="text-xl md:text-2xl font-semibold">
            Running short on time?
          </h3>
          <p className="text-muted-foreground">
            Browse our full Gifts in a Hurry collection and ship in days, not weeks.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="gap-2 min-h-[48px] touch-manipulation"
            onClick={handleShopNow}
          >
            <Zap className="h-4 w-4" />
            Shop Gifts in a Hurry
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2 min-h-[48px] touch-manipulation"
            onClick={handleShopNow}
          >
            Browse All Prime Picks
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </FullBleedSection>
  );
};

export default PrimeGiftsInAHurryCTA;
