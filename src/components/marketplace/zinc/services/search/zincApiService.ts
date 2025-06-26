
/**
 * Service for making Zinc API calls via Supabase Edge Functions
 */
import { ZincProduct } from "../../types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Track whether we've shown the API error toast already
let hasShownApiErrorToast = false;

/**
 * Call the Zinc API via Supabase Edge Function to search for products
 */
export const searchZincApi = async (
  query: string,
  maxResults: string
): Promise<ZincProduct[] | null> => {
  try {
    // Ensure we request enough products for better filtering
    const requestedResults = Math.max(parseInt(maxResults), 50).toString();
    
    console.log(`Making API call via Supabase Edge Function for query: "${query}", max results: ${requestedResults}`);
    
    // Use Supabase edge function with improved error handling
    const { data, error } = await supabase.functions.invoke('zinc-search', {
      body: {
        query: query.trim(),
        maxResults: requestedResults
      }
    });

    if (error) {
      console.error('Zinc search error via edge function:', error);
      
      if (!hasShownApiErrorToast) {
        hasShownApiErrorToast = true;
        toast.error('API Error', {
          description: 'Error calling Zinc API. Please check your API configuration.',
          duration: 5000,
        });
        
        // Reset the flag after some time
        setTimeout(() => {
          hasShownApiErrorToast = false;
        }, 30000);
      }
      
      return null;
    }

    console.log('Zinc API response via edge function:', data);
    
    // If we get results, return them
    if (data?.results && data.results.length > 0) {
      console.log(`Found ${data.results.length} results from Zinc API for "${query}"`);
      
      // Reset the error toast flag on successful response
      hasShownApiErrorToast = false;
      
      return data.results;
    }
    
    // No results found
    console.log(`No results found from Zinc API for "${query}"`);
    return null;
    
  } catch (error) {
    console.error(`Error calling Zinc API via edge function: ${error}`);
    
    if (!hasShownApiErrorToast) {
      hasShownApiErrorToast = true;
      toast.error('API Connection Error', {
        description: 'Failed to connect to product search API. Please try again.',
        duration: 5000,
      });
      
      // Reset the flag after some time
      setTimeout(() => {
        hasShownApiErrorToast = false;
      }, 30000);
    }
    
    return null;
  }
};
