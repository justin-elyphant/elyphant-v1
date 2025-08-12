import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, TrendingUp, ArrowRight } from "lucide-react";

import { FullBleedSection } from "@/components/layout/FullBleedSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { unifiedMarketplaceService } from "@/services/marketplace/UnifiedMarketplaceService";
import { useAuth } from "@/contexts/auth";
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";
import UnifiedProductCard from "@/components/marketplace/UnifiedProductCard";
import SignUpDialog from "@/components/marketplace/SignUpDialog";
import { Product } from "@/types/product";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

// Enhanced Product type with category badge
type ProductWithCategory = Product & { categoryBadge?: string };

const WishlistCreationCTA = () => {
  const { user } = useAuth();
  const { quickAddToWishlist, wishlists } = useUnifiedWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);

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
              maxResults: category.maxResults
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
            maxResults: 12
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
            maxResults: 12
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
      toast.success(`${product.title || product.name} has been added to your cart.`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error("Failed to add item to cart. Please try again.");
    }
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

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <>
              <Button 
                size="lg" 
                className="gap-2"
                onClick={() => window.scrollTo({ top: window.scrollY + 400, behavior: 'smooth' })}
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

        {user && wishlists.length > 0 && (
          <div className="text-sm text-muted-foreground">
            You have {wishlists.length} wishlist{wishlists.length !== 1 ? 's' : ''} with{' '}
            {wishlists.reduce((total, wishlist) => total + (wishlist.items?.length || 0), 0)} items
          </div>
        )}
      </div>

      {/* Product Grid */}
      <div className="relative">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {products.slice(0, 12).map((product) => (
              <div key={product.product_id || product.id} className="w-full relative">
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
                  onClick={() => {
                    // Optional: navigate to product detail
                    console.log("Product clicked:", product);
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {!user && (
          <div className="mt-8 text-center bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border/50">
            <p className="text-sm text-muted-foreground mb-3">
              Sign up to add these items to your wishlist
            </p>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleSignUpClick}
              className="gap-2"
            >
              <Heart className="h-4 w-4" />
              Create Account
            </Button>
          </div>
        )}
      </div>

      <SignUpDialog 
        open={showSignUpDialog} 
        onOpenChange={setShowSignUpDialog} 
      />
    </FullBleedSection>
  );
};

export default WishlistCreationCTA;