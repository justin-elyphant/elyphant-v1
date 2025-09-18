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
      
      if (!eventContext || !recipientName) {
        console.warn('⚠️ [PersonalizedMarketplace] Missing eventContext or recipientName, creating fallback');
        
        // Create fallback context if missing
        const fallbackContext = {
          recipientName: recipientName?.replace(/-/g, ' ') || 'Special Someone',
          eventType: 'special occasion',
          relationship: 'friend',
          isPersonalized: true
        };
        
        // Generate with fallback context
        try {
          setIsPersonalizedLoading(true);
          setPersonalizedError(null);

          console.log('🎯 [PersonalizedMarketplace] Generating with fallback context:', fallbackContext);

          // Try Nicole's marketplace intelligence service with fallback context
          const intelligenceResult = await nicoleMarketplaceIntelligenceService.getCuratedProducts({
            recipient_name: fallbackContext.recipientName,
            relationship: fallbackContext.relationship,
            occasion: fallbackContext.eventType,
            budget: undefined,
            interests: [],
            conversation_history: [],
            confidence_threshold: 0.3
          });

          if (intelligenceResult.recommendations && intelligenceResult.recommendations.length > 0) {
            console.log('✅ [PersonalizedMarketplace] Got fallback intelligence recommendations:', intelligenceResult.recommendations.length);
            const products = intelligenceResult.recommendations.map(rec => rec.product);
            setPersonalizedProducts(products);
            setIsPersonalizedLoading(false);
            return;
          }
        } catch (fallbackError) {
          console.warn('Fallback intelligence service failed:', fallbackError);
        }
        // Ensure personalized context is stored so the wrapper hides default hero
        try {
          sessionStorage.setItem('personalized-context', JSON.stringify({
            recipientName: fallbackContext.recipientName,
            eventType: fallbackContext.eventType,
            relationship: fallbackContext.relationship,
            isPersonalized: true
          }));
          // Optionally store empty products to signal personalization
          if (!sessionStorage.getItem('personalized-products')) {
            sessionStorage.setItem('personalized-products', JSON.stringify([]));
          }
        } catch (e) {
          console.warn('Failed to persist fallback personalized context:', e);
        }
        
        setIsPersonalizedLoading(false);
        return;
      }

      try {
        setIsPersonalizedLoading(true);
        setPersonalizedError(null);

        console.log('🎯 [PersonalizedMarketplace] Generating curated products for:', eventContext);
        console.log('🎯 [PersonalizedMarketplace] Recipient name from URL:', recipientName);

        // First try Nicole's marketplace intelligence service
        try {
          const intelligenceResult = await nicoleMarketplaceIntelligenceService.getCuratedProducts({
            recipient_name: eventContext.recipientName,
            relationship: eventContext.relationship || 'friend',
            occasion: eventContext.eventType,
            budget: undefined, // Let Nicole determine appropriate budget
            interests: [], // Could be enhanced with recipient interests
            conversation_history: [],
            confidence_threshold: 0.3
          });

          if (intelligenceResult.recommendations && intelligenceResult.recommendations.length > 0) {
            console.log('✅ [PersonalizedMarketplace] Got intelligence recommendations:', intelligenceResult.recommendations.length);
            const products = intelligenceResult.recommendations.map(rec => rec.product);
            setPersonalizedProducts(products);
            setIsPersonalizedLoading(false);
            return;
          }
        } catch (intelligenceError) {
          console.warn('Intelligence service failed, falling back to Nicole AI:', intelligenceError);
        }

        // Fallback to Nicole ChatGPT agent for curation
        const { data, error } = await supabase.functions.invoke('nicole-chatgpt-agent', {
          body: {
            action: 'generate_curated_marketplace',
            context: {
              recipientName: eventContext.recipientName,
              eventType: eventContext.eventType,
              relationship: eventContext.relationship || 'friend',
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
        } else {
          console.warn('No personalized products returned from Nicole AI, response:', data);
          setPersonalizedProducts([]);
        }

      } catch (error) {
        console.error('Failed to generate personalized marketplace:', error);
        setPersonalizedError(error instanceof Error ? error.message : 'Failed to load personalized recommendations');
        
        // Fallback to mock products for now to test the UI
        console.log('🔄 [PersonalizedMarketplace] Using fallback mock products for testing');
        setPersonalizedProducts([
          {
            id: 'mock-1',
            title: `Personalized Gift for ${eventContext.recipientName}`,
            price: 29.99,
            image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
            description: 'AI-curated gift recommendation',
            vendor: 'Nicole AI',
            category: 'Personalized'
          }
        ]);
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