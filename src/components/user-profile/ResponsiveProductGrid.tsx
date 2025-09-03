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

interface ResponsiveProductGridProps {
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

const ResponsiveProductGrid: React.FC<ResponsiveProductGridProps> = ({ profile, isOwnProfile }) => {
  const [products, setProducts] = useState<ProductWithSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<EnhancedProduct | null>(null);
  const [selectedWishlistItem, setSelectedWishlistItem] = useState<WishlistItem | null>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showWishlistItemDialog, setShowWishlistItemDialog] = useState(false);

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
          .limit(16); // Increased for better desktop display

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
        gridProducts.push(...interestProducts.slice(0, 8));

        // 3. Get AI recommendations (15% of grid) - Only for others viewing
        if (!isOwnProfile) {
          const aiProducts = await getAIRecommendations();
          console.log('🤖 AI products:', aiProducts.length);
          gridProducts.push(...aiProducts.slice(0, 4));
        }

        // 4. Get trending products (5% of grid)
        const trendingProducts = await getTrendingProducts();
        console.log('📈 Trending products:', trendingProducts.length);
        gridProducts.push(...trendingProducts.slice(0, 4));

        // Shuffle and limit to optimal number for desktop/mobile
        const shuffledProducts = shuffleArray(gridProducts).slice(0, 24);
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
      
      return results.slice(0, 6).map(product => ({
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
          .limit(16);

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
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {Array.from({ length: 24 }).map((_, i) => (
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
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="text-center py-12">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {isOwnProfile ? "Build Your Product Collection" : "No Products Yet"}
          </h3>
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
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* Responsive grid: 2 cols mobile, 3 tablet, 4-6 desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {products.map((product) => {
          const isWishlisted = wishlistedProducts.includes(product.product_id);
          const SourceIcon = product.sourceIcon;

          return (
            <Card
              key={product.product_id}
              className="group relative aspect-square cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden border-0 bg-white dark:bg-gray-800"
              onClick={() => handleProductClick(product)}
            >
              <CardContent className="p-0 h-full">
                {/* Product Image */}
                <div className="relative w-full h-full">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Overlay gradient for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    
                  {/* Source Badge */}
                  <Badge
                    className={cn(
                      "absolute top-2 left-2 text-xs px-2 py-1 shadow-sm backdrop-blur-sm",
                      product.sourceColor
                    )}
                  >
                    <SourceIcon className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">{product.sourceLabel}</span>
                  </Badge>

                  {/* Price Badge */}
                  {product.price > 0 && (
                    <Badge
                      variant="secondary"
                      className="absolute bottom-2 left-2 text-xs px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-900 shadow-sm"
                    >
                      {formatPrice(product.price)}
                    </Badge>
                   )}

                  {/* Action Buttons - Context Aware */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {product.source === 'wishlist' && isOwnProfile ? (
                      // Show remove button for own wishlist items
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/90 hover:bg-red-600 text-white shadow-sm backdrop-blur-sm"
                        onClick={(e) => handleRemoveFromWishlist(e, product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      // Show wishlist heart for other products
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 transition-all duration-200 shadow-sm backdrop-blur-sm",
                          isWishlisted 
                            ? "opacity-100 bg-red-500/90 text-white hover:bg-red-600" 
                            : "opacity-0 group-hover:opacity-100 bg-white/90 hover:bg-white text-gray-700"
                        )}
                        onClick={(e) => handleWishlistAction(e, product)}
                      >
                        <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
                      </Button>
                    )}
                  </div>

                  {/* Product Title - Only visible on hover for cleaner look */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <h4 className="text-white text-sm font-medium line-clamp-2 leading-tight">
                      {product.title}
                    </h4>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialogs */}
      {selectedProduct && (
        <ProductDetailsDialog
          open={showProductDialog}
          onOpenChange={setShowProductDialog}
          product={selectedProduct}
          userData={profile}
        />
      )}

      {selectedWishlistItem && (
        <WishlistItemManagementDialog
          open={showWishlistItemDialog}
          onOpenChange={setShowWishlistItemDialog}
          item={selectedWishlistItem}
          onItemRemoved={handleItemRemoved}
        />
      )}
    </div>
  );
};

export default ResponsiveProductGrid;