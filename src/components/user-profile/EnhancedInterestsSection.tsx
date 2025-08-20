import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { searchMultipleInterests } from "@/components/marketplace/zinc/utils/searchUtils";
import { toast } from "sonner";

interface EnhancedInterestsSectionProps {
  interests: string[];
  isOwnProfile: boolean;
  userName?: string;
}

const EnhancedInterestsSection = ({ interests, isOwnProfile, userName }: EnhancedInterestsSectionProps) => {
  const navigate = useNavigate();
  const [isSearchingAll, setIsSearchingAll] = useState(false);
  
  if (!interests || interests.length === 0) return null;

  const handleFindProducts = (interest: string) => {
    console.log(`Searching marketplace for interest: ${interest}`);
    navigate(`/marketplace?search=${encodeURIComponent(interest)}`);
  };

  const handleBrowseAllInterests = async () => {
    if (interests.length === 0) return;
    
    setIsSearchingAll(true);
    try {
      console.log(`[EnhancedInterests] Starting multi-interest search for:`, interests);

      // Perform multi-interest search with enhanced diversity
      const searchResult = await searchMultipleInterests(interests, {
        maxProductsPerInterest: 8,
        maxProductsPerBrand: 2,
        enableBrandDiversity: true,
        targetTotalResults: 24
      });

      if (searchResult.products.length > 0) {
        // Create a search query that represents all interests for URL
        const searchQuery = interests.join(' ');
        
        // Navigate to marketplace with the diversified results
        // Note: The actual diversified results will be handled by the marketplace's search logic
        navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}&multi_interest=true`);
        
        toast.success(`Found ${searchResult.totalResults} diverse products`, {
          description: `Products from: ${Object.keys(searchResult.searchBreakdown).join(', ')}`
        });
      } else {
        toast.error('No products found for your interests');
      }
    } catch (error) {
      console.error('[EnhancedInterests] Multi-interest search failed:', error);
      toast.error('Search failed', {
        description: 'Please try again or search interests individually'
      });
    } finally {
      setIsSearchingAll(false);
    }
  };
  
  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium mb-2">
        {isOwnProfile 
          ? "Your Interests" 
          : `Search Gifts Based on ${userName || "This User"}'s Interests`
        }
      </h3>
      <div className="grid gap-3">
        {interests.map((interest, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {interest}
              </div>
            </div>
            
            {!isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFindProducts(interest)}
                className="flex items-center gap-2 text-xs"
              >
                <Search className="h-3 w-3" />
                Find {interest} Products
              </Button>
            )}
          </div>
        ))}
        
        {!isOwnProfile && interests.length > 0 && (
          <div className="mt-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleBrowseAllInterests}
              disabled={isSearchingAll}
              className="flex items-center gap-2"
            >
              {isSearchingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isSearchingAll ? 'Finding Diverse Products...' : 'Browse All Interest Products'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedInterestsSection;