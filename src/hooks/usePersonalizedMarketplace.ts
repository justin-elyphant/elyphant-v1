import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { nicoleMarketplaceIntelligenceService } from "@/services/gifting/NicoleMarketplaceIntelligenceService";
import { Product } from "@/types/product";

export interface PersonalizedMarketplaceOptions {
  recipientName: string;
  relationship?: string;
  eventType?: string;
  budget?: [number, number];
  interests?: string[];
}

export interface PersonalizedMarketplaceResult {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  intelligenceSource: string | null;
  refresh: () => void;
}

export const usePersonalizedMarketplace = (
  options: PersonalizedMarketplaceOptions
): PersonalizedMarketplaceResult => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intelligenceSource, setIntelligenceSource] = useState<string | null>(null);

  const generatePersonalizedProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🎯 [usePersonalizedMarketplace] Generating products for:', options);

      // First try Nicole's marketplace intelligence service with sophisticated scoring
      try {
        // Try to find recipient profile for enhanced recommendations
        let recipientId: string | undefined;
        
        try {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, username')
            .or(`name.ilike.%${options.recipientName}%,username.ilike.%${options.recipientName.replace(/\s+/g, '')}%`)
            .limit(1);
            
          if (profiles && profiles.length > 0) {
            recipientId = profiles[0].id;
            console.log('✅ [usePersonalizedMarketplace] Found recipient profile for enhanced scoring:', profiles[0].name);
          }
        } catch (profileError) {
          console.log('ℹ️ [usePersonalizedMarketplace] No matching profile found, using AI curation');
        }

        const intelligenceResult = await nicoleMarketplaceIntelligenceService.getCuratedProducts({
          recipient_id: recipientId, // Enable wishlist-based recommendations (highest priority)
          recipient_name: options.recipientName,
          relationship: options.relationship || 'friend',
          occasion: options.eventType,
          budget: options.budget,
          interests: options.interests || [],
          conversation_history: [],
          confidence_threshold: 0.3
        });

        if (intelligenceResult.recommendations && intelligenceResult.recommendations.length > 0) {
          const tierBreakdown = intelligenceResult.recommendations.reduce((acc, rec) => {
            acc[rec.source] = (acc[rec.source] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          console.log('🎯 [NICOLE INTELLIGENCE] Hierarchical scoring results:', {
            total: intelligenceResult.recommendations.length,
            tierActivated: intelligenceResult.intelligence_source,
            sourceBreakdown: tierBreakdown,
            avgConfidence: Math.round(intelligenceResult.recommendations.reduce((sum, rec) => sum + rec.confidence_score, 0) / intelligenceResult.recommendations.length * 100) / 100,
            hasWishlistAccess: !!recipientId,
            interestsUsed: intelligenceResult.context_used.interests?.length || 0,
            topConfidenceScores: intelligenceResult.recommendations.slice(0, 3).map(r => ({
              source: r.source,
              confidence: Math.round(r.confidence_score * 100) / 100,
              product: r.product.title || r.product.name
            }))
          });

          // Log specific tier details for debugging
          if (tierBreakdown.wishlist > 0) {
            console.log(`✅ [TIER 1 - WISHLIST] Found ${tierBreakdown.wishlist} wishlist products (highest priority)`);
          }
          if (tierBreakdown.interests > 0) {
            console.log(`✅ [TIER 2 - INTERESTS] Found ${tierBreakdown.interests} interest-based products`);
          }
          if (tierBreakdown.ai_curated > 0) {
            console.log(`✅ [TIER 3 - AI CURATED] Found ${tierBreakdown.ai_curated} AI-curated products`);
          }
          if (tierBreakdown.demographic > 0) {
            console.log(`✅ [TIER 4 - DEMOGRAPHIC] Found ${tierBreakdown.demographic} demographic fallback products`);
          }
          
          const products = intelligenceResult.recommendations.map(rec => rec.product);
          setProducts(products);
          setIntelligenceSource('nicole-marketplace-intelligence');
          setIsLoading(false);
          return;
        }
      } catch (intelligenceError) {
        console.warn('Intelligence service failed, falling back to Nicole AI:', intelligenceError);
      }

      // Fallback to Nicole ChatGPT agent for curation
      const { data, error: agentError } = await supabase.functions.invoke('nicole-chatgpt-agent', {
        body: {
          action: 'generate_curated_marketplace',
          context: {
            recipientName: options.recipientName,
            eventType: options.eventType,
            relationship: options.relationship || 'friend',
            budget: options.budget
          }
        }
      });

      if (agentError) {
        throw new Error(agentError.message || 'Failed to generate personalized marketplace');
      }

      if (data?.products && data.products.length > 0) {
        console.log('✅ [usePersonalizedMarketplace] Got Nicole AI curated products:', data.products.length);
        setProducts(data.products);
        setIntelligenceSource('nicole-ai-agent');
      } else {
        console.warn('No personalized products returned from Nicole AI');
        setProducts([]);
        setIntelligenceSource('fallback');
      }

    } catch (err) {
      console.error('Failed to generate personalized marketplace:', err);
      setError(err instanceof Error ? err.message : 'Failed to load personalized recommendations');
      setProducts([]);
      setIntelligenceSource(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (options.recipientName) {
      generatePersonalizedProducts();
    }
  }, [
    options.recipientName,
    options.relationship,
    options.eventType,
    options.budget?.join('-'),
    options.interests?.join(',')
  ]);

  return {
    products,
    isLoading,
    error,
    intelligenceSource,
    refresh: generatePersonalizedProducts
  };
};