import React, { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useUnifiedMarketplace } from "@/hooks/useUnifiedMarketplace";
import MainLayout from "@/components/layout/MainLayout";
import SEOWrapper from "@/components/seo/SEOWrapper";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Heart, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import PersonalizedGiftingSections from "@/components/marketplace/PersonalizedGiftingSections";
import ProductDetailsDialog from "@/components/marketplace/ProductDetailsDialog";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { nicoleMarketplaceIntelligenceService } from "@/services/gifting/NicoleMarketplaceIntelligenceService";

// Component to display stats about personalized recommendations
const PersonalizedHeroStats: React.FC<{
  recipientName: string;
  eventType?: string;
  relationship?: string;
  productCount: number;
  isDesktop: boolean;
}> = ({ recipientName, eventType, relationship, productCount, isDesktop }) => {
  if (!isDesktop) return null;
  
  return (
    <div className="flex flex-wrap gap-6 text-center">
      <div className="flex-1 min-w-[120px]">
        <div className="text-2xl font-bold">{productCount}</div>
        <div className="text-sm opacity-80">Curated Gifts</div>
      </div>
      {eventType && (
        <div className="flex-1 min-w-[120px]">
          <div className="text-2xl font-bold">Perfect</div>
          <div className="text-sm opacity-80">For {eventType}</div>
        </div>
      )}
      {relationship && (
        <div className="flex-1 min-w-[120px]">
          <div className="text-2xl font-bold">Personal</div>
          <div className="text-sm opacity-80">{relationship} Gifts</div>
        </div>
      )}
    </div>
  );
};

interface PersonalizedMarketplaceProps {}

const PersonalizedMarketplace: React.FC<PersonalizedMarketplaceProps> = () => {
  const { recipientName } = useParams<{ recipientName: string }>();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { addToCart } = useCart();
  
  const [personalizedProducts, setPersonalizedProducts] = useState<any[]>([]);
  const [isPersonalizedLoading, setIsPersonalizedLoading] = useState(true);
  const [personalizedError, setPersonalizedError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);

  // Get event context from location state or URL params - memoized to prevent re-renders
  const eventContext = useMemo(() => ({
    recipientName: recipientName?.replace(/-/g, ' '),
    eventType: location.state?.eventType || null,
    relationship: location.state?.relationship || 'friend'
  }), [recipientName, location.state?.eventType, location.state?.relationship]);

  const displayName = eventContext?.recipientName || recipientName?.replace(/-/g, ' ') || 'Recipient';

  useEffect(() => {
    async function generatePersonalizedMarketplace() {
      console.log('🔍 [PersonalizedMarketplace] Debug - eventContext:', eventContext);
      console.log('🔍 [PersonalizedMarketplace] Debug - recipientName:', recipientName);
      console.log('🔍 [PersonalizedMarketplace] Debug - location.state:', location.state);
      
      if (!recipientName) {
        setPersonalizedError("No recipient specified");
        setIsPersonalizedLoading(false);
        return;
      }

      const contextToUse = eventContext;
      console.log('🎯 [PersonalizedMarketplace] Using context:', contextToUse);

      // Activate Nicole's sophisticated gift scoring system
      console.log('🎯 [PersonalizedMarketplace] Activating Nicole Intelligence Service for', contextToUse.recipientName);
      
      try {
        setIsPersonalizedLoading(true);
        setPersonalizedError(null);

        // First, try to get the recipient's profile for enhanced scoring
        let recipientId: string | null = null;
        let recipientInterests: string[] = [];

        try {
          // Fuzzy search by name variants (handles spaces, underscores, case)
          const baseName = (contextToUse.recipientName || '').trim();
          const patterns = [
            baseName,
            baseName.replace(/\s+/g, '_'),
            baseName.replace(/\s+/g, '')
          ].filter(Boolean);

          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, interests')
            .or(patterns.map(p => `name.ilike.%${p}%`).join(','))
            .limit(1);

          if (profiles && profiles.length > 0) {
            recipientId = profiles[0].id;
            recipientInterests = Array.isArray(profiles[0].interests) ? (profiles[0].interests as string[]) : [];
            console.log('✅ [PersonalizedMarketplace] Found recipient profile:', {
              name: profiles[0].name,
              id: recipientId,
              interests: recipientInterests
            });
          } else {
            // Try special-case mappings for demo recipients
            const normalizedName = (contextToUse.recipientName || '').trim().toLowerCase();
            const specialMap: Record<string, string> = {
              'dua lipa': '54087479-29f1-4f7f-afd0-cbdc31d6fb91',
              'dua_lipa': '54087479-29f1-4f7f-afd0-cbdc31d6fb91',
              'dualipa': '54087479-29f1-4f7f-afd0-cbdc31d6fb91'
            };
            if (specialMap[normalizedName]) {
              recipientId = specialMap[normalizedName];
              console.log('🎯 [PersonalizedMarketplace] Using special recipient mapping:', { name: normalizedName, id: recipientId });
            } else {
              // Fallback: use current logged-in user's profile (safe, respects privacy)
              const { data: auth } = await supabase.auth.getUser();
              const currentUserId = auth?.user?.id;
              if (currentUserId) {
                const { data: me } = await supabase
                  .from('profiles')
                  .select('id, name, interests')
                  .eq('id', currentUserId)
                  .maybeSingle();
                if (me) {
                  recipientId = me.id;
                  recipientInterests = Array.isArray(me.interests) ? (me.interests as string[]) : [];
                  console.log('🙋 [PersonalizedMarketplace] Using current user profile as recipient fallback:', {
                    name: me.name,
                    id: recipientId,
                    interests: recipientInterests
                  });
                }
              }
            }
          }
        } catch (error) {
          
        }

        // Call Nicole Intelligence Service for sophisticated gift curation
        try {
          

          // Use the client-side Nicole Intelligence Service instead of edge function
          const intelligenceResult = await nicoleMarketplaceIntelligenceService.getCuratedProducts({
            recipient_name: contextToUse.recipientName,
            recipient_id: recipientId,
            relationship: contextToUse.relationship,
            occasion: contextToUse.eventType,
            interests: recipientInterests,
            confidence_threshold: 0.7
          });

          if (intelligenceResult?.recommendations && intelligenceResult.recommendations.length > 0) {

            // Normalize mapping, robustly detect sources, then dedupe and diversify preferences
            const rawProducts = intelligenceResult.recommendations.map((rec: any) => {
              const sourceStr = String(rec.source || '').toLowerCase();
              const fromWishlist = sourceStr === 'wishlist' || sourceStr.includes('wish');
              const fromPreferences = sourceStr === 'interests' || sourceStr.includes('interest');
              const tier = fromWishlist ? 1 : fromPreferences ? 2 : 3;
              const base = rec.product || {};
              const product_id = base.product_id || base.id || base.asin || base.sku || base.url || `${(base.title || base.name || 'product')}-${Math.random().toString(36).slice(2, 8)}`;
              const title = base.title || base.name || 'Product';
              const image = base.image || (Array.isArray(base.images) ? base.images[0] : undefined) || '';
              
              
              
              return {
                ...base,
                product_id,
                title,
                image,
                // Flags used by grouping hook
                fromWishlist,
                fromPreferences,
                // Additional metadata
                giftingTier: tier,
                confidenceScore: rec.confidence_score,
                reasoning: rec.reasoning
              } as any;
            });

            // Helpers: dedupe and brand diversity for preferences
            const dedupeByIdOrTitle = (items: any[]) => {
              const seen = new Set<string>();
              return items.filter((p) => {
                const key = (p.product_id || p.id || p.asin || p.title || p.name)?.toString().toLowerCase();
                if (!key) return true;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
            };
            const diversifyByBrand = (items: any[], maxPerBrand = 2) => {
              const groups: Record<string, any[]> = {};
              for (const p of items) {
                const brandKey = (p.brand || p.vendor || p.retailer || 'unknown').toString().toLowerCase();
                (groups[brandKey] ||= []).push(p);
              }
              const queues = Object.values(groups).map((arr) => arr.slice(0, maxPerBrand));
              const result: any[] = [];
              let added = true;
              while (added) {
                added = false;
                for (const q of queues) {
                  const item = q.shift();
                  if (item) {
                    result.push(item);
                    added = true;
                  }
                }
              }
              return result;
            };

            const deduped = dedupeByIdOrTitle(rawProducts);
            const wishlistItems = deduped.filter((p: any) => p.fromWishlist);
            const preferenceItems = deduped.filter((p: any) => p.fromPreferences);
            const regularItems = deduped.filter((p: any) => !p.fromWishlist && !p.fromPreferences);
            const diversifiedPreferences = diversifyByBrand(preferenceItems, 2);
            const products = [...wishlistItems, ...diversifiedPreferences, ...regularItems];

            console.log('✅ [PersonalizedMarketplace] Processed products with tier information:', {
              total: products.length,
              wishlistFlagged: products.filter((p: any) => p.fromWishlist).length,
              preferencesFlagged: products.filter((p: any) => p.fromPreferences).length,
              regularItems: products.filter((p: any) => !p.fromWishlist && !p.fromPreferences).length
            });

            setPersonalizedProducts(products);

            // Store context for potential future use
            try {
              sessionStorage.setItem('personalized-context', JSON.stringify({
                recipientName: contextToUse.recipientName,
                eventType: contextToUse.eventType,
                relationship: contextToUse.relationship,
                isPersonalized: true,
                intelligenceSource: 'nicole-marketplace-service'
              }));
            } catch (e) {
              console.warn('Failed to store personalized context:', e);
            }

          } else {
            console.warn('No personalized products returned from Nicole Intelligence Service, using fallback');
            throw new Error('No recommendations from Nicole Intelligence Service');
          }

        } catch (nicoleError) {
          console.error('Nicole Intelligence Service failed, falling back to enhanced gift recommendations:', nicoleError);
          
          // Fallback to the enhanced gift recommendations edge function
          try {
            const { data, error } = await supabase.functions.invoke('enhanced-gift-recommendations', {
              body: {
                searchContext: {
                  recipient: contextToUse.recipientName,
                  relationship: contextToUse.relationship,
                  occasion: contextToUse.eventType,
                  interests: recipientInterests,
                  budget: [10, 200] // Default budget range
                },
                options: {
                  maxRecommendations: 20,
                  includeExplanations: true,
                  fallbackToGeneric: true
                }
              }
            });

            if (error) {
              throw new Error(`Enhanced gift recommendations failed: ${error.message}`);
            }

            if (data?.recommendations && data.recommendations.length > 0) {
              console.log('✅ [PersonalizedMarketplace] Got enhanced gift recommendations:', data.recommendations.length);
              
              // Transform the recommendations into products with flags
              const products = data.recommendations.map((rec: any, index: number) => ({
                ...rec,
                // Add flags for grouping - use match score to determine tier
                fromWishlist: rec.matchScore > 0.8,
                fromPreferences: rec.matchScore > 0.6 && rec.matchScore <= 0.8,
                // Additional metadata
                giftingTier: rec.matchScore > 0.8 ? 1 : rec.matchScore > 0.6 ? 2 : 3,
                confidenceScore: rec.matchScore,
                reasoning: rec.matchReasons?.join(', ') || 'AI recommendation'
              }));
              
              setPersonalizedProducts(products);
            } else {
              setPersonalizedProducts([]);
            }
          } catch (fallbackError) {
            console.error('All personalization methods failed:', fallbackError);
            setPersonalizedError('Failed to load personalized recommendations. Please try again.');
            setPersonalizedProducts([]);
          }
        }

      } catch (error) {
        console.error('Failed to generate personalized marketplace:', error);
        setPersonalizedError(error instanceof Error ? error.message : 'Failed to load personalized recommendations');
        setPersonalizedProducts([]);
      } finally {
        setIsPersonalizedLoading(false);
      }
    }

    generatePersonalizedMarketplace();
  }, [recipientName, eventContext.recipientName, eventContext.eventType, eventContext.relationship]);

  // Product interaction handlers
  const handleProductClick = (product: any) => {
    console.log('Product clicked:', product);
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  const handleAddToCart = async (product: any) => {
    try {
      await addToCart(product, 1);
      // Toast is handled by UnifiedPaymentService
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error("Failed to add item to cart. Please try again.");
    }
  };

  const handleShare = (product: any) => {
    console.log('Share product:', product);
    // TODO: Implement share functionality
  };

  const pageTitle = `Perfect Gifts for ${displayName} | Elyphant`;
  const pageDescription = `Discover personalized gift recommendations for ${displayName}${eventContext?.eventType ? ` for their ${eventContext.eventType}` : ''}. AI-curated selections based on their interests and your relationship.`;

  return (
    <SEOWrapper
      title={pageTitle}
      description={pageDescription}
      keywords={`personalized gifts, ${displayName}, ${eventContext?.eventType || 'gift ideas'}, AI recommendations, curated gifts`}
      url={`/marketplace/for/${recipientName}`}
    >
      <MainLayout>
        <div className="min-h-screen bg-background">
          {/* Personalized Hero Section */}
          {eventContext && (
            <div className="bg-gradient-primary text-white">
              <div className="container-header py-8 lg:py-12">
                <div className="text-center space-y-4 lg:space-y-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="h-6 w-6 lg:h-8 lg:w-8" />
                    <span className="text-sm lg:text-base font-medium opacity-90">Personalized Just For Them</span>
                  </div>
                  <h1 className="text-heading-1 lg:text-5xl xl:text-6xl font-bold">
                    Perfect Gifts for {displayName}
                  </h1>
                  <p className="text-body lg:text-lg max-w-2xl lg:max-w-4xl mx-auto opacity-90">
                    {eventContext.eventType 
                      ? `Thoughtfully curated ${eventContext.eventType} gifts that match their personality and your relationship`
                      : `Discover meaningful gifts selected just for ${displayName}`
                    }
                  </p>
                  
                  {isPersonalizedLoading && (
                    <div className="flex items-center justify-center gap-2 mt-4 lg:mt-6">
                      <div className="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 border-b-2 border-white"></div>
                      <span className="text-sm lg:text-base">Nicole is curating personalized recommendations...</span>
                    </div>
                  )}
                </div>
                
                {/* Desktop-only Stats */}
                <PersonalizedHeroStats
                  recipientName={displayName}
                  eventType={eventContext?.eventType}
                  relationship={eventContext?.relationship}
                  productCount={personalizedProducts.length}
                  isDesktop={!isMobile}
                />
              </div>
            </div>
          )}

          {/* Error State for Personalization */}
          {personalizedError && (
            <div className="container-header py-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {personalizedError}. Showing general marketplace instead.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Loading State */}
          {isPersonalizedLoading && (
            <div className="container-header py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
                {Array.from({ length: 12 }).map((_, index) => (
                  <Card key={index} className="p-4 space-y-3">
                    <Skeleton className="h-48 lg:h-56 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Success State with Personalized Products */}
          {!isPersonalizedLoading && personalizedProducts.length > 0 && (
            <div className="container-header py-4 lg:py-6">
              <div className="flex items-center gap-2 lg:gap-3 mb-6 lg:mb-8">
                <Heart className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                <span className="text-body-sm lg:text-body text-muted-foreground">
                  {personalizedProducts.length} personalized recommendations curated by Nicole AI
                </span>
              </div>
              
              {/* Personalized Gifting Sections */}
              <PersonalizedGiftingSections
                products={personalizedProducts}
                recipientName={displayName}
                onProductClick={handleProductClick}
                onAddToCart={handleAddToCart}
                onShare={handleShare}
              />
            </div>
          )}
        </div>
        
        {/* Product Details Dialog */}
        <ProductDetailsDialog
          product={selectedProduct}
          open={showProductDetails}
          onOpenChange={(open) => {
            setShowProductDetails(open);
            if (!open) setSelectedProduct(null);
          }}
          userData={null}
        />
      </MainLayout>
    </SEOWrapper>
  );
};

export default PersonalizedMarketplace;