import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useUnifiedMarketplace } from "@/hooks/useUnifiedMarketplace";
import StreamlinedMarketplaceWrapper from "@/components/marketplace/StreamlinedMarketplaceWrapper";
import MainLayout from "@/components/layout/MainLayout";
import SEOWrapper from "@/components/seo/SEOWrapper";
import { supabase } from "@/integrations/supabase/client";
import { nicoleMarketplaceIntelligenceService } from "@/services/gifting/NicoleMarketplaceIntelligenceService";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Heart, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import PersonalizedHeroStats from "@/components/marketplace/PersonalizedHeroStats";
import { useIsMobile } from "@/hooks/use-mobile";

interface PersonalizedMarketplaceProps {}

const PersonalizedMarketplace: React.FC<PersonalizedMarketplaceProps> = () => {
  const { recipientName } = useParams<{ recipientName: string }>();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [personalizedProducts, setPersonalizedProducts] = useState<any[]>([]);
  const [isPersonalizedLoading, setIsPersonalizedLoading] = useState(true);
  const [personalizedError, setPersonalizedError] = useState<string | null>(null);
  
  // Get event context from navigation state
  const eventContext = location.state?.eventContext;
  const displayName = eventContext?.recipientName || recipientName?.replace(/-/g, ' ') || 'Special Someone';
  
  // Generate personalized marketplace content
  useEffect(() => {
    async function generatePersonalizedMarketplace() {
      console.log('🔍 [PersonalizedMarketplace] Debug - eventContext:', eventContext);
      console.log('🔍 [PersonalizedMarketplace] Debug - recipientName:', recipientName);
      console.log('🔍 [PersonalizedMarketplace] Debug - location.state:', location.state);
      
      // For personalized marketplace, we should always try to generate products
      const contextToUse = eventContext || {
        recipientName: recipientName?.replace(/-/g, ' ') || 'Special Someone',
        eventType: 'special occasion',
        relationship: 'friend',
        isPersonalized: true
      };

      console.log('🎯 [PersonalizedMarketplace] Using context:', contextToUse);

      // Activate Nicole's sophisticated gift scoring system
      console.log('🎯 [PersonalizedMarketplace] Activating Nicole Intelligence Service for', contextToUse.recipientName);
      
      // Try to find recipient profile first for wishlist-based recommendations
      let recipientId: string | undefined;
      let recipientInterests: string[] = [];
      
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, username, interests')
          .or(`name.ilike.%${contextToUse.recipientName}%,username.ilike.%${contextToUse.recipientName.replace(/\s+/g, '')}%`)
          .limit(1);
          
        if (profiles && profiles.length > 0) {
          recipientId = profiles[0].id;
          recipientInterests = Array.isArray(profiles[0].interests) ? (profiles[0].interests as string[]) : [];
          console.log('✅ [PersonalizedMarketplace] Found recipient profile:', {
            name: profiles[0].name,
            interests: recipientInterests,
            hasWishlistAccess: !!recipientId
          });
        }
      } catch (error) {
        console.log('ℹ️ [PersonalizedMarketplace] No matching profile found, using AI curation');
      }

      try {
        setIsPersonalizedLoading(true);
        setPersonalizedError(null);

        console.log('🎯 [PersonalizedMarketplace] Activating sophisticated gift scoring system for:', contextToUse.recipientName);

        // First try Nicole's marketplace intelligence service with sophisticated scoring
        try {
          const intelligenceResult = await nicoleMarketplaceIntelligenceService.getCuratedProducts({
            recipient_id: recipientId, // Enable wishlist-based recommendations (Tier 1)
            recipient_name: contextToUse.recipientName,
            relationship: contextToUse.relationship || 'friend',
            occasion: contextToUse.eventType,
            budget: undefined, // Let Nicole determine appropriate budget
            interests: recipientInterests, // Now using actual recipient interests for diversification
            conversation_history: [],
            confidence_threshold: 0.3 // Allow lower confidence for broader recommendations
          });

          if (intelligenceResult.recommendations && intelligenceResult.recommendations.length > 0) {
            const tierBreakdown = intelligenceResult.recommendations.reduce((acc, rec) => {
              acc[rec.source] = (acc[rec.source] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            console.log('🎯 [PersonalizedMarketplace] Nicole Intelligence hierarchical results:', {
              total: intelligenceResult.recommendations.length,
              tierActivated: intelligenceResult.intelligence_source,
              sourceBreakdown: tierBreakdown,
              avgConfidence: Math.round(intelligenceResult.recommendations.reduce((sum, rec) => sum + rec.confidence_score, 0) / intelligenceResult.recommendations.length * 100) / 100,
              recipientProfile: {
                hasWishlistAccess: !!recipientId,
                interestsFound: recipientInterests.length,
                interests: recipientInterests
              },
              topProducts: intelligenceResult.recommendations.slice(0, 3).map(r => ({
                source: r.source,
                confidence: Math.round(r.confidence_score * 100) / 100,
                product: r.product.title || r.product.name
              }))
            });

            // Log tier-specific results for debugging
            if (tierBreakdown.wishlist > 0) {
              console.log(`✅ [TIER 1 - WISHLIST] Found ${tierBreakdown.wishlist} wishlist products (95% confidence)`);
            }
            if (tierBreakdown.interests > 0) {
              console.log(`✅ [TIER 2 - INTERESTS] Found ${tierBreakdown.interests} interest-based products (75% confidence)`);
              console.log(`🎯 [INTERESTS USED]:`, recipientInterests);
            }
            if (tierBreakdown.ai_curated > 0) {
              console.log(`✅ [TIER 3 - AI CURATED] Found ${tierBreakdown.ai_curated} AI-curated products`);
            }
            if (tierBreakdown.demographic > 0) {
              console.log(`✅ [TIER 4 - DEMOGRAPHIC] Found ${tierBreakdown.demographic} demographic fallback products`);
            }
            
            const products = intelligenceResult.recommendations.map(rec => rec.product);
            setPersonalizedProducts(products);
            
            // Store context for wrapper with intelligence source info
            try {
              sessionStorage.setItem('personalized-context', JSON.stringify({
                recipientName: contextToUse.recipientName,
                eventType: contextToUse.eventType,
                relationship: contextToUse.relationship,
                isPersonalized: true,
                intelligenceSource: intelligenceResult.intelligence_source,
                hasRecipientProfile: !!recipientId
              }));
            } catch (e) {
              console.warn('Failed to store personalized context:', e);
            }
            
            setIsPersonalizedLoading(false);
            return;
          }
        } catch (intelligenceError) {
          console.warn('Nicole Intelligence Service failed, falling back to Nicole AI:', intelligenceError);
        }

        // Fallback to Nicole ChatGPT agent for curation
        const { data, error } = await supabase.functions.invoke('nicole-chatgpt-agent', {
          body: {
            action: 'generate_curated_marketplace',
            context: {
              recipientName: contextToUse.recipientName,
              eventType: contextToUse.eventType,
              relationship: contextToUse.relationship || 'friend',
              budget: undefined // Let Nicole suggest appropriate range
            }
          }
        });

        if (error) {
          throw new Error(error.message || 'Failed to generate personalized marketplace');
        }

        if (data?.products && data.products.length > 0) {
          console.log('✅ [PersonalizedMarketplace] Got Nicole AI curated products:', data.products.length);
          setPersonalizedProducts(data.products);
          
          // Store context for wrapper
          try {
            sessionStorage.setItem('personalized-context', JSON.stringify({
              recipientName: contextToUse.recipientName,
              eventType: contextToUse.eventType,
              relationship: contextToUse.relationship,
              isPersonalized: true,
              intelligenceSource: 'nicole-ai-agent'
            }));
          } catch (e) {
            console.warn('Failed to store personalized context:', e);
          }
        } else {
          console.warn('No personalized products returned from Nicole AI, response:', data);
          setPersonalizedProducts([]);
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
  }, [recipientName, eventContext]);

  // Store personalized products in session storage for StreamlinedMarketplaceWrapper to use
  useEffect(() => {
    if (personalizedProducts.length > 0) {
      sessionStorage.setItem('personalized-products', JSON.stringify(personalizedProducts));
      sessionStorage.setItem('personalized-context', JSON.stringify({
        recipientName: displayName,
        eventType: eventContext?.eventType,
        isPersonalized: true
      }));
    }
  }, [personalizedProducts, displayName, eventContext]);

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
            </div>
          )}

          {/* Main Marketplace Content */}
          <StreamlinedMarketplaceWrapper />
        </div>
      </MainLayout>
    </SEOWrapper>
  );
};

export default PersonalizedMarketplace;