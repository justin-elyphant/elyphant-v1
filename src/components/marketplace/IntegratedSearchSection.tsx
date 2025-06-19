
import React from "react";
import { useSearchParams } from "react-router-dom";
import { useUserSearchHistory } from "@/hooks/useUserSearchHistory";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { toast } from "sonner";

interface IntegratedSearchSectionProps {
  onRecentSearchClick?: (search: string) => void;
}

const IntegratedSearchSection: React.FC<IntegratedSearchSectionProps> = ({
  onRecentSearchClick,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { recentSearches } = useUserSearchHistory();
  const currentSearch = searchParams.get("search");

  const handleRecentSearchClick = (term: string) => {
    // Dismiss all existing toasts before starting new search
    toast.dismiss();
    
    const newParams = new URLSearchParams(searchParams);
    newParams.set("search", term);
    // Clear category when performing a search to avoid conflicts
    newParams.delete("category");
    setSearchParams(newParams, { replace: true });
    
    if (onRecentSearchClick) {
      onRecentSearchClick(term);
    }
  };

  // Only show recent searches if there's no active search and we have searches
  const shouldShowRecentSearches = recentSearches.length > 0 && !currentSearch;

  // If no recent searches to show, don't render anything
  if (!shouldShowRecentSearches) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 py-3">
        {/* Recent Searches Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">Recent:</span>
          </div>
          
          <Carousel
            opts={{
              align: "start",
              slidesToScroll: 1,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-1">
              {recentSearches.map((term, idx) => (
                <CarouselItem key={term + idx} className="pl-1 basis-auto">
                  <button
                    className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-purple-700 font-medium text-xs shadow-sm border border-purple-200 hover:bg-purple-100 transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 whitespace-nowrap"
                    type="button"
                    onClick={() => handleRecentSearchClick(term)}
                    aria-label={`Search again for ${term}`}
                  >
                    {term}
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </div>
  );
};

export default IntegratedSearchSection;
