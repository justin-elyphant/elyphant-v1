import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles } from "lucide-react";
import { useEnhancedGiftRecommendations } from "@/hooks/useEnhancedGiftRecommendations";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { useNavigate } from "react-router-dom";
import UnifiedProductCard from "@/components/marketplace/UnifiedProductCard";
import { Product } from "@/types/product";

interface GiftSuggestionsPreviewProps {
  interests: string[];
  profileId: string;
  profileName: string;
  isOwnProfile: boolean;
  wishlistItems?: any[];
}

const GiftSuggestionsPreview = ({ 
  interests, 
  profileId, 
  profileName, 
  isOwnProfile,
  wishlistItems = []
}: GiftSuggestionsPreviewProps) => {
  const navigate = useNavigate();
  const { searchProducts } = useUnifiedSearch({ maxResults: 12 });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  if (isOwnProfile || !interests?.length) return null;

  const { 
    generateRecommendations, 
    recommendations, 
    loading: aiLoading,
    hasRecommendations 
  } = useEnhancedGiftRecommendations();

  const [hasGenerated, setHasGenerated] = useState(false);

  // Fetch curated product grid from multiple sources
  useEffect(() => {
    const fetchProductsFromMultipleSources = async () => {
      if (loading) return;
      
      setLoading(true);
      try {
        const allProducts: Product[] = [];
        
        // 1. Get products from interests (3-4 products per major interest)
        const mainInterests = interests.slice(0, 3); // Focus on top 3 interests
        for (const interest of mainInterests) {
          try {
            const interestProducts = await searchProducts(interest, { maxResults: 4 });
            allProducts.push(...interestProducts);
          } catch (error) {
            console.log(`Failed to fetch products for ${interest}:`, error);
          }
        }

        // 2. Remove duplicates and limit to 10 items
        const uniqueProducts = allProducts
          .filter((product, index, self) => 
            index === self.findIndex(p => p.id === product.id)
          )
          .slice(0, 10);

        setProducts(uniqueProducts);
      } catch (error) {
        console.error('Failed to fetch gift suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (interests.length > 0) {
      fetchProductsFromMultipleSources();
    }
  }, [interests, searchProducts]);

  // Still generate AI recommendations for fallback
  useEffect(() => {
    if (!hasGenerated && interests.length > 0) {
      const searchContext = {
        recipient_name: profileName,
        interests: interests,
        occasion: "general",
        budget_range: "25-100"
      };
      
      generateRecommendations(
        searchContext,
        profileId,
        `preview-${profileId}`,
        { maxRecommendations: 3, fallbackToGeneric: true }
      );
      setHasGenerated(true);
    }
  }, [interests, profileId, profileName, generateRecommendations, hasGenerated]);

  const handleViewAllProducts = () => {
    const searchQuery = interests.join(' ');
    navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
  };

  if (loading || aiLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gift Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bot className="h-4 w-4 animate-pulse" />
              Finding perfect products based on {profileName}'s interests...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0 && !hasRecommendations) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gift Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              Discover perfect gifts for {profileName} based on their interests
            </p>
            <Button
              onClick={handleViewAllProducts}
              className="flex items-center gap-2"
            >
              <Bot className="h-4 w-4" />
              Browse Gift Ideas
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Gift Suggestions
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({products.length} curated items)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {products.map((product) => (
            <div key={product.id} className="min-h-[200px]">
              <UnifiedProductCard
                product={product}
                cardType="mobile"
                onProductClick={(productId) => navigate(`/marketplace/product/${productId}`)}
              />
            </div>
          ))}
        </div>
        
        <div className="pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewAllProducts}
            className="w-full flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            View All Gift Ideas for {profileName}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GiftSuggestionsPreview;