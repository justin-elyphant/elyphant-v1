import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Target, Bot, TrendingUp, ShoppingBag, ExternalLink } from "lucide-react";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import { useEnhancedGiftRecommendations } from "@/hooks/useEnhancedGiftRecommendations";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SocialProductGridProps {
  profile: any;
  isOwnProfile: boolean;
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
}

const SocialProductGrid: React.FC<SocialProductGridProps> = ({ profile, isOwnProfile }) => {
  const [products, setProducts] = useState<ProductWithSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  const { handleWishlistToggle, wishlistedProducts } = useWishlist();
  const { generateRecommendations, recommendations } = useEnhancedGiftRecommendations();
  const { searchProducts } = useUnifiedSearch({ maxResults: 8 });

  // Fetch wishlist items directly from database
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

        // Get items from all these wishlists
        const { data: items, error: itemsError } = await supabase
          .from('wishlist_items')
          .select('*')
          .in('wishlist_id', wishlists.map(w => w.id))
          .order('created_at', { ascending: false })
          .limit(12); // Get more items than we need for variety

        if (itemsError) {
          console.error('Error fetching wishlist items:', itemsError);
          return;
        }

        console.log('🎁 Found wishlist items:', items);
        setWishlistItems(items || []);
      } catch (error) {
        console.error('Error in fetchWishlistItems:', error);
      }
    };

    fetchWishlistItems();
  }, [profile?.id]);

  useEffect(() => {
    const loadSocialGrid = async () => {
      if (!profile) return;

      setLoading(true);
      const gridProducts: ProductWithSource[] = [];

      try {
        console.log('🚀 Loading social grid with wishlist items:', wishlistItems.length);
        
        // 1. Get wishlist items (50% of grid) - PRIORITIZE THESE!
        const wishlistProducts = extractWishlistProducts();
        console.log('❤️ Wishlist products extracted:', wishlistProducts.length);
        gridProducts.push(...wishlistProducts);

        // 2. Get interest-based products (30% of grid)
        const interestProducts = await getInterestBasedProducts();
        console.log('🎯 Interest products:', interestProducts.length);
        gridProducts.push(...interestProducts.slice(0, 6));

        // 3. Get AI recommendations (15% of grid) - Only for others viewing
        if (!isOwnProfile) {
          const aiProducts = await getAIRecommendations();
          console.log('🤖 AI products:', aiProducts.length);
          gridProducts.push(...aiProducts.slice(0, 3));
        }

        // 4. Get trending products (5% of grid)
        const trendingProducts = await getTrendingProducts();
        console.log('📈 Trending products:', trendingProducts.length);
        gridProducts.push(...trendingProducts.slice(0, 2));

        // Shuffle and limit to 20 items for Instagram-like grid
        const shuffledProducts = shuffleArray(gridProducts).slice(0, 20);
        console.log('🎲 Final grid products:', shuffledProducts.length);
        setProducts(shuffledProducts);
      } catch (error) {
        console.error('Error loading social grid:', error);
      } finally {
        setLoading(false);
      }
    };

    // Only load the grid once we have attempted to fetch wishlist items
    loadSocialGrid();
  }, [profile?.id, wishlistItems]);

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
      const searchQuery = interests.slice(0, 3).join(' ');
      const results = await searchProducts(searchQuery);
      
      return results.map(product => ({
        ...product,
        source: 'interests' as const,
        sourceIcon: Target,
        sourceLabel: 'Interests',
        sourceColor: 'bg-blue-100 text-blue-700'
      }));
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
      }, profile?.id || 'anonymous', `social-grid-${Date.now()}`);

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
      const results = await searchProducts('trending popular bestseller');
      
      return results.slice(0, 4).map(product => ({
        ...product,
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
    if (product.source === 'wishlist') {
      // Navigate to wishlist detail or product page
      console.log('Navigate to product:', product.title);
    } else {
      // Open product in marketplace or external link
      console.log('View product:', product.title);
    }
  };

  const handleWishlistAction = async (e: React.MouseEvent, product: ProductWithSource) => {
    e.stopPropagation();
    await handleWishlistToggle(product.product_id, product);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-muted rounded-lg animate-pulse"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isOwnProfile 
              ? "Start building your social grid by adding items to your wishlists!"
              : "No products to display yet."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => {
            const isWishlisted = wishlistedProducts.includes(product.product_id);
            const SourceIcon = product.sourceIcon;

            return (
              <div
                key={product.product_id}
                className="group relative aspect-square cursor-pointer"
                onClick={() => handleProductClick(product)}
              >
                {/* Product Image */}
                <div className="relative w-full h-full bg-muted rounded-lg overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  
                  {/* Source Badge */}
                  <Badge
                    className={cn(
                      "absolute top-2 left-2 text-xs px-2 py-1",
                      product.sourceColor
                    )}
                  >
                    <SourceIcon className="w-3 h-3 mr-1" />
                    {product.sourceLabel}
                  </Badge>

                  {/* Price Badge */}
                  {product.price > 0 && (
                    <Badge
                      variant="secondary"
                      className="absolute bottom-2 left-2 text-xs"
                    >
                      {formatPrice(product.price)}
                    </Badge>
                  )}

                  {/* Wishlist Heart */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                      isWishlisted && "opacity-100"
                    )}
                    onClick={(e) => handleWishlistAction(e, product)}
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4",
                        isWishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"
                      )}
                    />
                  </Button>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-center text-white p-2">
                      <p className="text-sm font-medium line-clamp-2">{product.title}</p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="secondary" className="text-xs">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid Stats */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {[
            { source: 'wishlist', icon: Heart, label: 'Wishlist', color: 'text-red-600' },
            { source: 'interests', icon: Target, label: 'Interests', color: 'text-blue-600' },
            { source: 'ai', icon: Bot, label: 'AI Picks', color: 'text-purple-600' },
            { source: 'trending', icon: TrendingUp, label: 'Trending', color: 'text-orange-600' }
          ].map(({ source, icon: Icon, label, color }) => {
            const count = products.filter(p => p.source === source).length;
            if (count === 0) return null;
            
            return (
              <Badge key={source} variant="outline" className="text-xs">
                <Icon className={cn("w-3 h-3 mr-1", color)} />
                {count} {label}
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialProductGrid;