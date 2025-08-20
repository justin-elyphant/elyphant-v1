import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, Heart } from "lucide-react";
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
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  if (isOwnProfile || !interests?.length) return null;

  const { 
    generateRecommendations, 
    recommendations, 
    loading: aiLoading,
    hasRecommendations 
  } = useEnhancedGiftRecommendations();

  const [hasGenerated, setHasGenerated] = useState(false);

  // Convert wishlist items to Product format and set wishlist products
  useEffect(() => {
    console.log('🎯 GiftSuggestionsPreview - wishlistItems received:', wishlistItems);
    console.log('🎯 wishlistItems type:', typeof wishlistItems);
    console.log('🎯 wishlistItems is array?:', Array.isArray(wishlistItems));
    console.log('🎯 wishlistItems keys:', wishlistItems ? Object.keys(wishlistItems) : 'null');
    console.log('🎯 wishlistItems structure:', JSON.stringify(wishlistItems, null, 2));
    
    // Add analysis of the wishlist structure
    if (Array.isArray(wishlistItems)) {
      console.log('🎯 Wishlist analysis:', wishlistItems.map((w, i) => ({
        index: i,
        title: w?.title,
        hasItems: !!(w?.items && Array.isArray(w.items)),
        itemCount: w?.items?.length || 0,
        itemStructure: w?.items?.[0] ? Object.keys(w.items[0]) : []
      })));
    }
    
    // Extract wishlist items properly
    if (Array.isArray(wishlistItems) && wishlistItems.length > 0) {
      const convertedWishlistProducts: Product[] = [];
      
      // Process each wishlist and extract its items
      wishlistItems.forEach((wishlist) => {
        if (wishlist?.items && Array.isArray(wishlist.items)) {
          wishlist.items.forEach((item: any) => {
            convertedWishlistProducts.push({
              id: item.product_id || item.id,
              title: item.title || item.name,
              price: typeof item.price === 'number' ? item.price : parseFloat(item.price || '0'),
              brand: item.brand || '',
              image_url: item.image_url || '',
              category: 'Wishlist Item',
              description: item.description || '',
              amazon_url: `https://amazon.com/dp/${item.product_id}`,
              rating: 0,
              reviews: 0,
              tags: []
            });
          });
        }
      });
      
      console.log('🎯 Converted wishlist products:', convertedWishlistProducts.length);
      if (convertedWishlistProducts.length > 0) {
        setWishlistProducts(convertedWishlistProducts);
        alert(`SUCCESS: Found ${convertedWishlistProducts.length} wishlist items for ${profileName}!`);
      }
    } else {
      console.log('🎯 No wishlist items found - setting empty array');
      setWishlistProducts([]);
    }
        console.log(`🎯 Processing wishlist/item ${index}:`, wishlistOrItem);
        console.log(`🎯 Item keys:`, Object.keys(wishlistOrItem || {}));
        
        // Check if this is a wishlist with items property
        if (wishlistOrItem.items && Array.isArray(wishlistOrItem.items)) {
          console.log('🎯 Found wishlist with items array, length:', wishlistOrItem.items.length);
          wishlistOrItem.items.forEach((item: any, itemIndex: number) => {
            console.log(`🎯 Processing wishlist item ${itemIndex}:`, item);
            const product: Product = {
              product_id: item.product_id || item.id || `wishlist-${Math.random()}`,
              id: item.product_id || item.id || `wishlist-${Math.random()}`,
              title: item.product_name || item.name || item.title || 'Unknown Product',
              name: item.product_name || item.name || item.title || 'Unknown Product',
              price: item.price || 0,
              image: item.image_url || item.image || '/placeholder.svg',
              description: item.description || '',
              brand: item.brand || '',
              category: item.category || '',
              rating: item.rating || 0,
              reviewCount: item.review_count || 0,
              fromWishlist: true
            };
            convertedWishlistProducts.push(product);
          });
        }
        // Check if this is a direct wishlist item
        else if (wishlistOrItem.product_id || wishlistOrItem.id) {
          console.log('🎯 Found direct wishlist item');
          const product: Product = {
            product_id: wishlistOrItem.product_id || wishlistOrItem.id || `wishlist-${Math.random()}`,
            id: wishlistOrItem.product_id || wishlistOrItem.id || `wishlist-${Math.random()}`,
            title: wishlistOrItem.product_name || wishlistOrItem.name || wishlistOrItem.title || 'Unknown Product',
            name: wishlistOrItem.product_name || wishlistOrItem.name || wishlistOrItem.title || 'Unknown Product',
            price: wishlistOrItem.price || 0,
            image: wishlistOrItem.image_url || wishlistOrItem.image || '/placeholder.svg',
            description: wishlistOrItem.description || '',
            brand: wishlistOrItem.brand || '',
            category: wishlistOrItem.category || '',
            rating: wishlistOrItem.rating || 0,
            reviewCount: wishlistOrItem.review_count || 0,
            fromWishlist: true
          };
          convertedWishlistProducts.push(product);
        }
        // If it has product_data nested
        else if (wishlistOrItem.product_data) {
          console.log('🎯 Found wishlist item with product_data');
          const productData = wishlistOrItem.product_data;
          const product: Product = {
            product_id: productData.product_id || productData.id || `wishlist-${Math.random()}`,
            id: productData.product_id || productData.id || `wishlist-${Math.random()}`,
            title: productData.title || productData.name || 'Unknown Product',
            name: productData.title || productData.name || 'Unknown Product',
            price: productData.price || 0,
            image: productData.image || productData.image_url || '/placeholder.svg',
            description: productData.description || '',
            brand: productData.brand || '',
            category: productData.category || '',
            rating: productData.rating || 0,
            reviewCount: productData.review_count || 0,
            fromWishlist: true
          };
          convertedWishlistProducts.push(product);
        }
        else {
          console.log('🎯 Unknown wishlist item structure:', wishlistOrItem);
        }
  }, [wishlistItems, profileName]);

  // Fetch curated product grid from multiple sources
  useEffect(() => {
    const fetchProductsFromMultipleSources = async () => {
      if (loading) return;
      
      setLoading(true);
      try {
        const allProducts: Product[] = [];
        
        // 1. Get products from interests (3-4 products per major interest)
        const mainInterests = interests.slice(0, 2); // Reduce to make room for wishlist items
        for (const interest of mainInterests) {
          try {
            const interestProducts = await searchProducts(interest, { maxResults: 3 });
            allProducts.push(...interestProducts);
          } catch (error) {
            console.log(`Failed to fetch products for ${interest}:`, error);
          }
        }

        // 2. Remove duplicates and limit items
        const uniqueProducts = allProducts
          .filter((product, index, self) => 
            index === self.findIndex(p => p.id === product.id)
          )
          .slice(0, 6);

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
        profileId, // Remove preview- prefix to fix UUID parsing error
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

  if (wishlistProducts.length === 0 && products.length === 0 && !hasRecommendations) {
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

  // Combine all products in priority order: wishlist first, then interests, then AI
  const allDisplayProducts = [
    ...wishlistProducts,
    ...products,
    // Convert AI recommendations to Product format
    ...(recommendations?.slice(0, 2).map((rec: any) => ({
      product_id: rec.id || `rec-${Math.random()}`,
      id: rec.id || `rec-${Math.random()}`,
      title: rec.title || rec.name || 'AI Recommendation',
      price: rec.price || 0,
      image: rec.image || rec.image_url || '/placeholder.svg',
      description: rec.description || '',
      brand: rec.brand || '',
      category: rec.category || 'recommendation',
      rating: rec.rating || 0,
      reviewCount: rec.review_count || 0
    } satisfies Product)) || [])
  ].slice(0, 12); // Limit total display

  console.log('🎯 Final display products:', {
    wishlistCount: wishlistProducts.length,
    interestCount: products.length,
    aiCount: recommendations?.length || 0,
    totalDisplay: allDisplayProducts.length
  });

  const getProductBadge = (product: Product, index: number) => {
    if (index < wishlistProducts.length) {
      return (
        <Badge variant="secondary" className="absolute top-2 left-2 z-10 bg-primary/10 text-primary">
          <Heart className="h-3 w-3 mr-1" />
          From {profileName}'s Wishlist
        </Badge>
      );
    } else if (index < wishlistProducts.length + products.length) {
      return (
        <Badge variant="outline" className="absolute top-2 left-2 z-10 bg-background/80">
          Based on Interests
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="absolute top-2 left-2 z-10 bg-background/80">
          <Bot className="h-3 w-3 mr-1" />
          AI Pick
        </Badge>
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Gift Suggestions
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({allDisplayProducts.length} curated items)
          </span>
        </CardTitle>
        {wishlistProducts.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Featuring items from {profileName}'s wishlist
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {allDisplayProducts.map((product, index) => (
            <div key={product.product_id || product.id} className="min-h-[200px] relative">
              {getProductBadge(product, index)}
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