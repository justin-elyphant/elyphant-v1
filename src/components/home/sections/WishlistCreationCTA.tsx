import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, TrendingUp, ArrowRight } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { FullBleedSection } from "@/components/layout/FullBleedSection";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
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
            <span className="text-sm font-medium">Trending Now</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Create Your Perfect{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Wishlist
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover trending products and save your favorites. Build wishlists for yourself or share them with others.
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

      {/* Horizontal Product Carousel */}
      <div className="relative">
        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="min-w-[280px] aspect-[3/4] bg-muted/50 rounded-lg animate-pulse flex-shrink-0" />
            ))}
          </div>
        ) : (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {products.slice(0, 12).map((product) => (
                <CarouselItem 
                  key={product.product_id || product.id} 
                  className={`pl-2 md:pl-4 ${
                    isMobile 
                      ? 'basis-full max-w-[280px]' 
                      : 'basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5'
                  }`}
                >
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
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {!isMobile && (
              <>
                <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
                <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
              </>
            )}
          </Carousel>
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