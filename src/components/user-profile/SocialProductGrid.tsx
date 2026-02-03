import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Target, Bot, TrendingUp, ShoppingBag, ExternalLink, Trash2 } from "lucide-react";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import { useEnhancedGiftRecommendations } from "@/hooks/useEnhancedGiftRecommendations";
import { useMarketplace } from "@/hooks/useMarketplace";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import WishlistItemManagementDialog from "./WishlistItemManagementDialog";
import ResponsiveProductGrid from "./ResponsiveProductGrid";
import DesktopProfileWrapper from "./DesktopProfileWrapper";
import { productCatalogService } from "@/services/ProductCatalogService";

interface SocialProductGridProps {
  profile: any;
  isOwnProfile: boolean;
  isPreviewMode?: boolean;
}

interface ProductWithSource extends Product {
  source: 'wishlist' | 'interests' | 'ai' | 'trending';
  sourceIcon: React.ComponentType<any>;
  sourceLabel: string;
  sourceColor: string;
}

interface WishlistItem {
  id: string;
  name?: string;
  title?: string;
  price?: number;
  image_url?: string;
  product_url?: string;
  wishlist_id?: string;
}

interface EnhancedProduct extends Product {
  source?: 'wishlist' | 'interests' | 'ai' | 'trending';
  isZincApiProduct?: boolean;
}

const SocialProductGrid: React.FC<SocialProductGridProps> = ({ profile, isOwnProfile, isPreviewMode = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<ProductWithSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [purchasedItemIds, setPurchasedItemIds] = useState<Set<string>>(new Set());
  
  // Extract display name for personalized headings
  const displayName = profile?.display_name || profile?.full_name || profile?.username || "Their";
  const [selectedWishlistItem, setSelectedWishlistItem] = useState<WishlistItem | null>(null);
  const [showWishlistItemDialog, setShowWishlistItemDialog] = useState(false);

  const { handleWishlistToggle, wishlistedProducts } = useWishlist();
  const { generateRecommendations, recommendations } = useEnhancedGiftRecommendations();
  const { executeSearch } = useMarketplace();

  // Fetch wishlist items and purchased status directly from database
  useEffect(() => {
    const fetchWishlistItems = async () => {
      if (!profile?.id) return;

      try {
        console.log('🔍 Fetching wishlist items for profile:', profile.id);
        
        // Get wishlists for this user (all for own profile, public only for others)
        let wishlistQuery = supabase
          .from('wishlists')
          .select('id, title')
          .eq('user_id', profile.id);
        
        // Only filter by public if viewing someone else's profile
        if (!isOwnProfile) {
          wishlistQuery = wishlistQuery.eq('is_public', true);
        }
        
        const { data: wishlists, error: wishlistError } = await wishlistQuery;

        if (wishlistError) {
          console.error('Error fetching wishlists:', wishlistError);
          return;
        }

        if (!wishlists || wishlists.length === 0) {
          console.log('No public wishlists found for user');
          setWishlistItems([]);
          return;
        }

        console.log('📋 Found wishlists:', wishlists);
        const wishlistIds = wishlists.map(w => w.id);

        // Get items from all these wishlists
        const { data: items, error: itemsError } = await supabase
          .from('wishlist_items')
          .select('*')
          .in('wishlist_id', wishlistIds)
          .order('created_at', { ascending: false })
          .limit(12); // Get more items than we need for variety

        if (itemsError) {
          console.error('Error fetching wishlist items:', itemsError);
          return;
        }

        console.log('🎁 Found wishlist items:', items);
        setWishlistItems(items || []);

        // Fetch purchased items for these wishlists
        const { data: purchasedData, error: purchasedError } = await supabase
          .from('wishlist_item_purchases')
          .select('item_id')
          .in('wishlist_id', wishlistIds);

        if (purchasedError) {
          console.error('Error fetching purchased items:', purchasedError);
        } else {
          const purchasedIds = new Set(purchasedData?.map(p => p.item_id) || []);
          console.log('✅ Purchased item IDs:', purchasedIds);
          setPurchasedItemIds(purchasedIds);
        }
      } catch (error) {
        console.error('Error in fetchWishlistItems:', error);
      }
    };

    fetchWishlistItems();
  }, [profile?.id, isOwnProfile]);

  // State for categorized products
  const [wishlistProducts, setWishlistProducts] = useState<ProductWithSource[]>([]);
  const [interestProducts, setInterestProducts] = useState<ProductWithSource[]>([]);
  const [aiProducts, setAiProducts] = useState<ProductWithSource[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<ProductWithSource[]>([]);

  useEffect(() => {
    const loadSocialGrid = async () => {
      if (!profile) return;

      setLoading(true);

      try {
        console.log('🚀 Loading social grid with wishlist items:', wishlistItems.length);
        
        // 1. Get wishlist items - PRIORITIZE THESE!
        const wishlist = extractWishlistProducts();
        console.log('❤️ Wishlist products extracted:', wishlist.length);
        setWishlistProducts(wishlist);

        // 2. Get interest-based products
        const interests = await getInterestBasedProducts();
        console.log('🎯 Interest products:', interests.length);
        setInterestProducts(interests.slice(0, 8));

        // 3. Get AI recommendations - Only for others viewing
        if (!isOwnProfile && !isPreviewMode) {
          const ai = await getAIRecommendations();
          console.log('🤖 AI products:', ai.length);
          setAiProducts(ai.slice(0, 6));
        }

        // 4. Get trending products
        const trending = await getTrendingProducts();
        console.log('📈 Trending products:', trending.length);
        setTrendingProducts(trending.slice(0, 6));

        // Also set combined products for backward compatibility
        const combined = [...wishlist, ...interests.slice(0, 6), ...trending.slice(0, 4)];
        setProducts(shuffleArray(combined).slice(0, 24));
      } catch (error) {
        console.error('Error loading social grid:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSocialGrid();
  }, [profile?.id, wishlistItems, isOwnProfile, isPreviewMode]);

  const extractWishlistProducts = (): ProductWithSource[] => {
    console.log('🎁 Extracting wishlist products from items:', wishlistItems.length);
    
    if (!wishlistItems || wishlistItems.length === 0) {
      console.log('❌ No wishlist items to extract');
      return [];
    }

    const products: ProductWithSource[] = [];
    for (const item of wishlistItems) {
      products.push({
        product_id: item.id || `wishlist-${Math.random()}`,
        title: item.name || item.title || 'Wishlist Item',
        price: item.price || 0,
        image: item.image_url || '/placeholder.svg',
        source: 'wishlist',
        sourceIcon: Heart,
        sourceLabel: 'Wishlist',
        sourceColor: 'bg-red-100 text-red-700'
      });
    }
    
    console.log('✅ Extracted wishlist products:', products.length);
    return products;
  };

  const getInterestBasedProducts = async (): Promise<ProductWithSource[]> => {
    const interests = profile?.interests || [];
    if (interests.length === 0) return [];

    try {
      const allResults: ProductWithSource[] = [];
      
      // Search for each interest separately to ensure diverse results
      for (const interest of interests.slice(0, 3)) {
        try {
          const response = await executeSearch(interest);
          const results = response.products || [];
          
          // Take top 2-3 products from each interest for diversity
          const productsPerInterest = Math.ceil(8 / Math.min(interests.length, 3));
          const interestProducts = results.slice(0, productsPerInterest).map(product => ({
            ...product,
            source: 'interests' as const,
            sourceIcon: Target,
            sourceLabel: 'Interests',
            sourceColor: 'bg-blue-100 text-blue-700'
          }));
          
          allResults.push(...interestProducts);
        } catch (error) {
          console.error(`Error fetching products for interest "${interest}":`, error);
        }
      }
      
      // Shuffle to mix different interests together and limit to 8
      return shuffleArray(allResults).slice(0, 8);
    } catch (error) {
      console.error('Error fetching interest-based products:', error);
      return [];
    }
  };

  const getAIRecommendations = async (): Promise<ProductWithSource[]> => {
    try {
      await generateRecommendations({
        recipient: profile?.name || 'User',
        interests: profile?.interests || [],
        budget: [25, 200] as [number, number],
        occasion: 'general'
      }, profile?.id || 'anonymous', null); // Pass null instead of invalid UUID

      return recommendations.map(rec => ({
        product_id: rec.productId || `ai-${Math.random()}`,
        title: rec.title,
        price: rec.price || 0,
        image: rec.imageUrl || '/placeholder.svg',
        source: 'ai' as const,
        sourceIcon: Bot,
        sourceLabel: 'AI Pick',
        sourceColor: 'bg-purple-100 text-purple-700'
      }));
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      return [];
    }
  };

  const getTrendingProducts = async (): Promise<ProductWithSource[]> => {
    try {
      // Use productCatalogService for trending products
      const response = await productCatalogService.searchProducts('trending gifts', { limit: 8 });
      
      return (response.products || []).map(product => ({
        ...product,
        product_id: product.product_id || product.id,
        title: product.title || product.name,
        price: product.price,
        image: product.image || product.main_image,
        source: 'trending' as const,
        sourceIcon: TrendingUp,
        sourceLabel: 'Trending',
        sourceColor: 'bg-orange-100 text-orange-700'
      }));
    } catch (error) {
      console.error('Error fetching trending products:', error);
      return [];
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleProductClick = (product: ProductWithSource) => {
    // In preview mode, don't allow editing
    if (product.source === 'wishlist' && isOwnProfile && !isPreviewMode) {
      // For wishlist items on own profile (not in preview), show wishlist management
      const wishlistItem = wishlistItems.find(item => 
        (item.name || item.title) === product.title
      );
      
      if (wishlistItem) {
        setSelectedWishlistItem(wishlistItem);
        setShowWishlistItemDialog(true);
      }
    } else {
      // For all other products (trending, AI, interests), show full marketplace dialog
      const productForDialog: EnhancedProduct = {
        id: product.product_id,
        product_id: product.product_id,
        title: product.title,
        name: product.title,
        price: product.price,
        image: product.image,
        images: [product.image], // Ensure we have an images array
        description: getEnhancedDescription(product),
        vendor: "",
        retailer: "Amazon",
        rating: product.rating || product.stars || 4.2,
        stars: product.rating || product.stars || 4.2,
        reviewCount: product.reviewCount || product.num_reviews || 127,
        num_reviews: product.reviewCount || product.num_reviews || 127,
        brand: product.brand || extractBrand(product.title),
        category: product.category,
        source: product.source, // Source information for context
        // Mark trending/AI products as Zinc API products to prevent price re-conversion
        isZincApiProduct: product.source === 'trending' || product.source === 'ai'
      };
      
      // Navigate to full-page product details
      navigate(`/marketplace/product/${product.product_id}`, {
        state: {
          product: productForDialog,
          context: 'profile',
          returnPath: location.pathname
        }
      });
    }
  };

  const getEnhancedDescription = (product: ProductWithSource): string => {
    const productType = product.title.split(' ').slice(1).join(' ');
    const brand = extractBrand(product.title);
    
    if (product.source === 'ai') {
      return `AI selected this ${productType} based on user preferences and trending data. This item combines quality with thoughtful design that matches current interests and gift-giving patterns.`;
    } else if (product.source === 'trending') {
      return `Currently trending among users! This ${productType} is popular and highly rated. Features premium materials and exceptional craftsmanship for long-lasting use.`;
    } else if (product.source === 'interests') {
      return `Recommended based on profile interests. This ${productType} aligns with preferences and offers great value for money with excellent user reviews.`;
    }
    
    return `The ${brand} ${productType} is a high-quality product designed for performance and reliability. This item features premium materials and exceptional craftsmanship.`;
  };

  const extractBrand = (title: string): string => {
    const words = title.split(' ');
    return words[0] || 'Brand';
  };

  const handleWishlistAction = async (e: React.MouseEvent, product: ProductWithSource) => {
    e.stopPropagation();
    await handleWishlistToggle(product.product_id, product);
  };

  const handleRemoveFromWishlist = async (e: React.MouseEvent, product: ProductWithSource) => {
    e.stopPropagation();
    
    // Don't allow removal in preview mode
    if (isPreviewMode) return;
    
    const wishlistItem = wishlistItems.find(item => 
      (item.name || item.title) === product.title
    );
    
    if (wishlistItem) {
      setSelectedWishlistItem(wishlistItem);
      setShowWishlistItemDialog(true);
    }
  };

  const handleItemRemoved = () => {
    // Refresh the wishlist items after removal
    const fetchWishlistItems = async () => {
      if (!profile?.id) return;

      try {
        let wishlistQuery = supabase
          .from('wishlists')
          .select('id, title')
          .eq('user_id', profile.id);
        
        if (!isOwnProfile) {
          wishlistQuery = wishlistQuery.eq('is_public', true);
        }
        
        const { data: wishlists, error: wishlistError } = await wishlistQuery;

        if (wishlistError || !wishlists || wishlists.length === 0) {
          setWishlistItems([]);
          return;
        }

        const { data: items, error: itemsError } = await supabase
          .from('wishlist_items')
          .select('*')
          .in('wishlist_id', wishlists.map(w => w.id))
          .order('created_at', { ascending: false })
          .limit(12);

        if (!itemsError) {
          setWishlistItems(items || []);
        }
      } catch (error) {
        console.error('Error refreshing wishlist items:', error);
      }
    };

    fetchWishlistItems();
  };

  if (loading) {
    return (
      <DesktopProfileWrapper className="w-full px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-muted rounded-lg animate-pulse"
            />
          ))}
        </div>
      </DesktopProfileWrapper>
    );
  }

  const hasAnyProducts = wishlistProducts.length > 0 || interestProducts.length > 0 || 
                          aiProducts.length > 0 || trendingProducts.length > 0;

  if (!hasAnyProducts) {
    return (
      <DesktopProfileWrapper className="w-full px-4">
        <div className="text-center py-8">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isOwnProfile 
              ? "Start building your social grid by adding items to your wishlists!"
              : "No products to display yet."}
          </p>
        </div>
      </DesktopProfileWrapper>
    );
  }

  // Helper function to handle product clicks in categorized sections
  const handleCategorizedProductClick = (product: Product, source: string) => {
    const productWithSource: ProductWithSource = {
      ...product,
      source: source as any,
      sourceIcon: source === 'wishlist' ? Heart : source === 'interests' ? Target : source === 'ai' ? Bot : TrendingUp,
      sourceLabel: source === 'wishlist' ? 'Wishlist' : source === 'interests' ? 'Interests' : source === 'ai' ? 'AI Pick' : 'Trending',
      sourceColor: source === 'wishlist' ? 'bg-red-100 text-red-700' : source === 'interests' ? 'bg-blue-100 text-blue-700' : source === 'ai' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
    };
    handleProductClick(productWithSource);
  };

  return (
    <div>
      <DesktopProfileWrapper className="w-full px-4">
        {/* Categorized Product Sections */}
        <div className="space-y-8">
          {/* Wishlist Section - Primary */}
          {wishlistProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Heart className="h-6 w-6 text-red-500" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold">
                    {isOwnProfile ? "My Wishlist Items" : `Everything ${displayName} Wants`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isOwnProfile ? "Your favorite items" : "Items they actually want - perfect gift ideas!"}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'}
                </Badge>
              </div>
              <ResponsiveProductGrid
                products={wishlistProducts}
                isOwnProfile={isOwnProfile}
                isPreviewMode={isPreviewMode}
                onProductClick={handleProductClick}
                onWishlistAction={handleWishlistAction}
                onRemoveFromWishlist={handleRemoveFromWishlist}
                wishlistedProducts={wishlistedProducts}
                purchasedItemIds={purchasedItemIds}
              />
            </div>
          )}

          {/* Interest-Based Section */}
          {interestProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-6 w-6 text-blue-500" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold">
                    {isOwnProfile ? "Based on My Interests" : `Based on ${displayName}'s Interests`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isOwnProfile ? "Products matching your hobbies and preferences" : "Products matching their hobbies and preferences"}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {interestProducts.length} {interestProducts.length === 1 ? 'item' : 'items'}
                </Badge>
              </div>
              <ResponsiveProductGrid
                products={interestProducts}
                isOwnProfile={isOwnProfile}
                isPreviewMode={isPreviewMode}
                onProductClick={handleProductClick}
                onWishlistAction={handleWishlistAction}
                onRemoveFromWishlist={handleRemoveFromWishlist}
                wishlistedProducts={wishlistedProducts}
              />
            </div>
          )}

          {/* AI Recommendations Section - Only for others viewing */}
          {!isOwnProfile && !isPreviewMode && aiProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Bot className="h-6 w-6 text-purple-500" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold">AI Gift Suggestions</h3>
                  <p className="text-sm text-muted-foreground">Smart recommendations based on their profile</p>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  {aiProducts.length} {aiProducts.length === 1 ? 'item' : 'items'}
                </Badge>
              </div>
              <ResponsiveProductGrid
                products={aiProducts}
                isOwnProfile={isOwnProfile}
                isPreviewMode={isPreviewMode}
                onProductClick={handleProductClick}
                onWishlistAction={handleWishlistAction}
                onRemoveFromWishlist={handleRemoveFromWishlist}
                wishlistedProducts={wishlistedProducts}
              />
            </div>
          )}

          {/* Trending Section */}
          {trendingProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-6 w-6 text-orange-500" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold">Popular Right Now</h3>
                  <p className="text-sm text-muted-foreground">Trending gifts people love</p>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  {trendingProducts.length} {trendingProducts.length === 1 ? 'item' : 'items'}
                </Badge>
              </div>
              <ResponsiveProductGrid
                products={trendingProducts}
                isOwnProfile={isOwnProfile}
                isPreviewMode={isPreviewMode}
                onProductClick={handleProductClick}
                onWishlistAction={handleWishlistAction}
                onRemoveFromWishlist={handleRemoveFromWishlist}
                wishlistedProducts={wishlistedProducts}
              />
            </div>
          )}
        </div>
      </DesktopProfileWrapper>

      {/* Dialogs */}
      <WishlistItemManagementDialog
        item={selectedWishlistItem}
        open={showWishlistItemDialog}
        onOpenChange={setShowWishlistItemDialog}
        onItemRemoved={handleItemRemoved}
      />
    </div>
  );
};

export default SocialProductGrid;