import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, TrendingUp, ArrowRight } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

import { FullBleedSection } from "@/components/layout/FullBleedSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { unifiedMarketplaceService } from "@/services/marketplace/UnifiedMarketplaceService";
import { useAuth } from "@/contexts/auth";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import UnifiedProductCard from "@/components/marketplace/UnifiedProductCard";
import SignUpDialog from "@/components/marketplace/SignUpDialog";
import ProductDetailsDialog from "@/components/marketplace/product-details/ProductDetailsDialog";
import { Product } from "@/types/product";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { toast } from "sonner";

// Enhanced Product type with category badge
type ProductWithCategory = Product & { categoryBadge?: string };

const WishlistCreationCTA = () => {
  const { user } = useAuth();
  const { quickAddToWishlist, wishlists } = useUnifiedWishlistSystem();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const { addItem: addToRecentlyViewed } = useRecentlyViewed();

  useEffect(() => {
    const fetchDiverseProducts = async () => {
      try {
        setLoading(true);
        
        // Define diverse categories that appeal to different audiences (12 total products)
        const categorySearches = [
          { name: "Tech", query: "best selling smartphone laptop tablet", maxResults: 2 },
          { name: "Fashion", query: "best selling fashion accessories jewelry", maxResults: 2 },
          { name: "Home", query: "best selling home decor kitchen appliances", maxResults: 2 },
          { name: "Beauty", query: "best selling skincare makeup perfume", maxResults: 2 },
          { name: "Sports", query: "best selling fitness equipment sports gear", maxResults: 2 },
          { name: "Books", query: "bestselling books fiction", maxResults: 2 }
        ];
        
        // Fetch products from all categories in parallel
        const categoryPromises = categorySearches.map(async (category) => {
          try {
            const results = await unifiedMarketplaceService.searchProducts(category.query, {
              maxResults: category.maxResults,
              silent: true // Prevent toasts for background loading
            });
            return results.map(product => ({ ...product, categoryBadge: category.name }));
          } catch (error) {
            console.error(`Error fetching ${category.name} products:`, error);
            return [];
          }
        });
        
        const allCategoryResults = await Promise.allSettled(categoryPromises);
        
        // Combine all successful results
        const allProducts: ProductWithCategory[] = [];
        allCategoryResults.forEach(result => {
          if (result.status === 'fulfilled') {
            allProducts.push(...result.value);
          }
        });
        
        // Shuffle products for variety on each visit
        const shuffledProducts = allProducts.sort(() => Math.random() - 0.5);
        
        if (shuffledProducts.length === 0) {
          // Ultimate fallback if all categories fail
          const fallbackResults = await unifiedMarketplaceService.searchProducts("trending", {
            maxResults: 12,
            silent: true // Prevent toasts for background loading
          });
          setProducts(fallbackResults);
        } else {
          setProducts(shuffledProducts);
        }
      } catch (error) {
        console.error("Error fetching diverse products:", error);
        // Final fallback
        try {
          const fallbackResults = await unifiedMarketplaceService.searchProducts("best selling", {
            maxResults: 12,
            silent: true // Prevent toasts for background loading
          });
          setProducts(fallbackResults);
        } catch (fallbackError) {
          console.error("Error with fallback search:", fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDiverseProducts();
  }, []);

  const handleSignUpClick = () => {
    setShowSignUpDialog(true);
  };

  const handleViewWishlists = () => {
    navigate("/profile?tab=wishlists");
  };

  const handleProductWishlistClick = async (product: ProductWithCategory) => {
    if (!user) {
      setShowSignUpDialog(true);
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

  // Add to cart handler for product cards
  const handleAddToCart = async (product: Product) => {
    console.log('WishlistCreationCTA - Add to cart:', product);
    try {
      await addToCart(product, 1);
      // Toast is handled by UnifiedPaymentService
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error("Failed to add item to cart. Please try again.");
    }
  };

  // Handle product click to view details
  const handleProductClick = (product: ProductWithCategory) => {
    const productId = product.product_id || product.id;
    if (!productId) return;

    // Add to recently viewed
    addToRecentlyViewed({
      id: String(productId),
      title: product.title || product.name || '',
      image: product.image || '',
      price: product.price || 0,
      brand: product.brand || ''
    });

    // Open modal instead of navigating
    setSelectedProductId(String(productId));
  };

  return (
    <FullBleedSection 
      background="bg-gradient-to-r from-background via-muted/30 to-background"
      height="auto"
      className="py-16 sm:py-20"
    >
      {/* Header Section */}
      <div className="text-center space-y-6 mb-12">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-primary">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-medium">Popular Across Categories</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Create Your Perfect{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Wishlist
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover popular products across tech, fashion, home, beauty, and more. Build wishlists for yourself or share them with others.
          </p>
        </div>

        {user && wishlists.length > 0 && (
          <div className="text-sm text-muted-foreground">
            You have {wishlists.length} wishlist{wishlists.length !== 1 ? 's' : ''} with{' '}
            {wishlists.reduce((total, wishlist) => total + (wishlist.items?.length || 0), 0)} items
          </div>
        )}
      </div>

      {/* Product Display - Mobile Carousel / Desktop Grid */}
      <div className="relative">
        {loading ? (
          <>
            {/* Mobile Loading */}
            <div className="block md:hidden">
              <div className="grid grid-cols-2 gap-4 px-4 -mx-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
            
            {/* Desktop Loading */}
            <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Mobile Grid - Top 6 Products */}
            <div className="block md:hidden">
              <div className="grid grid-cols-2 gap-4 px-4 -mx-4">
                {products.slice(0, 6).map((product) => (
                  <div key={product.product_id || product.id} className="relative h-full min-h-[400px]">
                    {product.categoryBadge && (
                      <div className="absolute top-2 left-2 z-10 bg-primary/95 text-primary-foreground text-xs px-2 py-1 rounded-md font-medium shadow-sm">
                        {product.categoryBadge}
                      </div>
                    )}
                    <div className="h-full">
                      <UnifiedProductCard
                        cardType="gifting"
                        product={product}
                        isGifteeView={true}
                        onToggleWishlist={() => handleProductWishlistClick(product)}
                        onAddToCart={handleAddToCart}
                        onClick={() => handleProductClick(product)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Grid Layout */}
            <div className="hidden md:block">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
                {products.slice(0, 12).map((product) => (
                  <div 
                    key={product.product_id || product.id} 
                    className="relative transition-transform duration-200 hover:scale-105 h-80"
                  >
                    {product.categoryBadge && (
                      <div className="absolute top-2 left-2 z-10 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-md font-medium">
                        {product.categoryBadge}
                      </div>
                    )}
                    <UnifiedProductCard
                      cardType="gifting"
                      product={product}
                      isGifteeView={true}
                      onToggleWishlist={() => handleProductWishlistClick(product)}
                      onAddToCart={handleAddToCart}
                      onClick={() => handleProductClick(product)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>

      {/* CTA Section - Below Products */}
      <div className="text-center mt-12">
        <div className="space-y-4 mb-6">
          <h3 className="text-xl md:text-2xl font-semibold">
            Ready to start your wishlist?
          </h3>
          <p className="text-muted-foreground">
            {user 
              ? "Add these products to your wishlist and share with friends and family" 
              : "Sign up to create wishlists and share them with friends and family"
            }
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <>
              <Button 
                size="lg" 
                className="gap-2"
                onClick={() => window.scrollTo({ top: window.scrollY - 400, behavior: 'smooth' })}
              >
                <Heart className="h-4 w-4" />
                Add to My Wishlist
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2"
                onClick={handleViewWishlists}
              >
                View My Wishlists
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button 
                size="lg" 
                className="gap-2"
                onClick={handleSignUpClick}
              >
                <Heart className="h-4 w-4" />
                Sign Up to Create Wishlist
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2"
                onClick={handleSignUpClick}
              >
                Learn More
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <SignUpDialog 
        open={showSignUpDialog} 
        onOpenChange={setShowSignUpDialog} 
      />

      <ProductDetailsDialog
        productId={selectedProductId}
        open={selectedProductId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProductId(null);
          }
        }}
        userData={user}
        source="wishlist"
      />
      
    </FullBleedSection>
  );
};

export default WishlistCreationCTA;