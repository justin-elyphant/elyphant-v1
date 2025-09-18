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

      // First try Nicole's marketplace intelligence service
      try {
        const intelligenceResult = await nicoleMarketplaceIntelligenceService.getCuratedProducts({
          recipient_name: options.recipientName,
          relationship: options.relationship || 'friend',
          occasion: options.eventType,
          budget: options.budget,
          interests: options.interests || [],
          conversation_history: [],
          confidence_threshold: 0.3
        });

        if (intelligenceResult.recommendations && intelligenceResult.recommendations.length > 0) {
          console.log('✅ [usePersonalizedMarketplace] Got intelligence recommendations:', intelligenceResult.recommendations.length);
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