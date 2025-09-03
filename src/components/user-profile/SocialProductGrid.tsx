import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Target, Bot, TrendingUp, ShoppingBag, ExternalLink, Trash2 } from "lucide-react";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import { useEnhancedGiftRecommendations } from "@/hooks/useEnhancedGiftRecommendations";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import ProductDetailsDialog from "@/components/marketplace/product-details/ProductDetailsDialog";
import WishlistItemManagementDialog from "./WishlistItemManagementDialog";

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
  wishlist_id?: string;
}

interface EnhancedProduct extends Product {
  source?: 'wishlist' | 'interests' | 'ai' | 'trending';
  isZincApiProduct?: boolean;
}

const SocialProductGrid: React.FC<SocialProductGridProps> = ({ profile, isOwnProfile }) => {
  const [products, setProducts] = useState<ProductWithSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<EnhancedProduct | null>(null);
  const [selectedWishlistItem, setSelectedWishlistItem] = useState<WishlistItem | null>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showWishlistItemDialog, setShowWishlistItemDialog] = useState(false);

  // Debug layout dimensions
  useEffect(() => {
    const logDimensions = () => {
      console.log('[SocialProductGrid Layout Debug]');
      console.log('Window dimensions:', {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      });
      console.log('Document dimensions:', {
        documentWidth: document.documentElement.clientWidth,
        bodyWidth: document.body.clientWidth,
        bodyScrollWidth: document.body.scrollWidth
      });
      
      // Find grid container
      const gridContainer = document.querySelector('[class*="grid-cols-2"]');
      if (gridContainer) {
        const rect = gridContainer.getBoundingClientRect();
        console.log('Grid container:', {
          width: rect.width,
          height: rect.height,
          left: rect.left,
          right: rect.right,
          classes: gridContainer.className
        });
      }
      
      // Find parent containers
      const containers = document.querySelectorAll('[class*="ResponsiveContainer"], [class*="InstagramProfileLayout"]');
      containers.forEach((container, i) => {
        const rect = container.getBoundingClientRect();
        console.log(`Container ${i}:`, {
          width: rect.width,
          classes: container.className.slice(0, 50) + '...'
        });
      });
    };
    
    logDimensions();
    window.addEventListener('resize', logDimensions);
    return () => window.removeEventListener('resize', logDimensions);
  }, []);


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
    if (product.source === 'wishlist' && isOwnProfile) {
      // For wishlist items on own profile, show wishlist management
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
      
      setSelectedProduct(productForDialog);
      setShowProductDialog(true);
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
      <div 
        className="w-full overflow-x-hidden"
        style={{ maxWidth: '100vw', minWidth: 0, boxSizing: 'border-box' }}
      >
        <div 
          className="grid grid-cols-2 gap-1 p-1" 
          style={{ maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-muted rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div 
        className="w-full overflow-x-hidden p-1"
        style={{ maxWidth: '100vw', minWidth: 0, boxSizing: 'border-box' }}
      >
        <div className="text-center py-8">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isOwnProfile 
              ? "Start building your social grid by adding items to your wishlists!"
              : "No products to display yet."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full"
      style={{ maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}
    >
      <div 
        className="grid grid-cols-2 gap-1 p-1 w-full" 
        style={{ maxWidth: '100%', minWidth: 0 }}
      >
        {products.map((product) => {
          const isWishlisted = wishlistedProducts.includes(product.product_id);
          const SourceIcon = product.sourceIcon;

          return (
            <div
              key={product.product_id}
              className="group relative aspect-square cursor-pointer min-w-0"
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
                    "absolute top-1 left-1 text-xs px-1.5 py-0.5 scale-90",
                    product.sourceColor
                  )}
                >
                  <SourceIcon className="w-2.5 h-2.5 mr-0.5" />
                  <span className="hidden sm:inline">{product.sourceLabel}</span>
                </Badge>

                {/* Price Badge */}
                {product.price > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 scale-90"
                  >
                    {formatPrice(product.price)}
                  </Badge>
                 )}

                {/* Action Buttons - Context Aware */}
                <div className="absolute top-1 right-1 flex gap-1">
                  {product.source === 'wishlist' && isOwnProfile ? (
                    // Show remove button for own wishlist items
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 sm:h-8 sm:w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 hover:bg-red-500"
                      onClick={(e) => handleRemoveFromWishlist(e, product)}
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </Button>
                  ) : (
                    // Show wishlist heart for other products
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-6 w-6 sm:h-8 sm:w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                        isWishlisted && "opacity-100"
                      )}
                      onClick={(e) => handleWishlistAction(e, product)}
                    >
                      <Heart
                        className={cn(
                          "h-3 w-3 sm:h-4 sm:w-4",
                          isWishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"
                        )}
                      />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialogs */}
      <ProductDetailsDialog
        product={selectedProduct}
        open={showProductDialog}
        onOpenChange={setShowProductDialog}
        userData={profile}
        source={selectedProduct?.source}
        onWishlistChange={handleItemRemoved}
      />

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