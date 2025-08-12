import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, TrendingUp, ArrowRight } from "lucide-react";
import { unifiedMarketplaceService } from "@/services/marketplace/UnifiedMarketplaceService";
import { useAuth } from "@/contexts/auth";
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";
import UnifiedProductCard from "@/components/marketplace/UnifiedProductCard";
import SignUpDialog from "@/components/marketplace/SignUpDialog";
import { Product } from "@/types/product";
import { useNavigate } from "react-router-dom";

const WishlistCreationCTA = () => {
  const { user } = useAuth();
  const { quickAddToWishlist, wishlists } = useUnifiedWishlist();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);

  useEffect(() => {
    const fetchTrendingProducts = async () => {
      try {
        setLoading(true);
        const results = await unifiedMarketplaceService.searchProducts("trending", {
          maxResults: 15
        });
        
        if (results.length === 0) {
          // Fallback to "best selling"
          const fallbackResults = await unifiedMarketplaceService.searchProducts("best selling", {
            maxResults: 15
          });
          setProducts(fallbackResults);
        } else {
          setProducts(results);
        }
      } catch (error) {
        console.error("Error fetching trending products:", error);
        // Final fallback to popular categories
        try {
          const popularResults = await unifiedMarketplaceService.searchProducts("electronics gadgets", {
            maxResults: 15
          });
          setProducts(popularResults);
        } catch (fallbackError) {
          console.error("Error with fallback search:", fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingProducts();
  }, []);

  const handleSignUpClick = () => {
    setShowSignUpDialog(true);
  };

  const handleViewWishlists = () => {
    navigate("/profile?tab=wishlists");
  };

  const handleProductWishlistClick = async (product: Product) => {
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

  return (
    <section className="w-full bg-gradient-to-r from-background via-muted/30 to-background py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* CTA Content - Left Side */}
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <div className="space-y-4">
              <div className="flex items-center justify-center lg:justify-start gap-2 text-primary">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-medium">Top Selling Products</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Create Your Perfect{" "}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Wishlist
                </span>
              </h2>
              
              <p className="text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0">
                Discover trending products and save your favorites. Build wishlists for yourself or share them with others.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
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

          {/* Products Grid - Right Side */}
          <div className="flex-1 w-full">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-6">
                {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="aspect-square bg-muted/50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Trending Now</h3>
                      <div className="text-sm text-muted-foreground">
                        {products.length} products
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {products.slice(0, 12).map((product) => (
                        <div key={product.product_id || product.id} className="group">
                          <UnifiedProductCard
                            cardType="gifting"
                            product={product}
                            isGifteeView={true}
                            onToggleWishlist={() => handleProductWishlistClick(product)}
                            onClick={() => {
                              // Optional: navigate to product detail
                              console.log("Product clicked:", product);
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    {!user && (
                      <div className="pt-4 border-t border-border/50 text-center">
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
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <SignUpDialog 
        open={showSignUpDialog} 
        onOpenChange={setShowSignUpDialog} 
      />
    </section>
  );
};

export default WishlistCreationCTA;