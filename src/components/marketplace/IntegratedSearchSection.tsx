
import React from "react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserSearchHistory } from "@/hooks/useUserSearchHistory";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Smartphone, Home, Shirt, Dumbbell, Gamepad2, Heart, Baby, Coffee, BookOpen, Music } from "lucide-react";

const categories = [
  { name: "Tech", icon: Smartphone, param: "electronics", searchTerm: "best selling electronics" },
  { name: "Home", icon: Home, param: "home", searchTerm: "best selling home products" },
  { name: "Fashion", icon: Shirt, param: "fashion", searchTerm: "best selling fashion" },
  { name: "Sports", icon: Dumbbell, param: "sports", searchTerm: "best selling sports equipment" },
  { name: "Gaming", icon: Gamepad2, param: "gaming", searchTerm: "best selling gaming" },
  { name: "Beauty", icon: Heart, param: "beauty", searchTerm: "best selling beauty products" },
  { name: "Baby", icon: Baby, param: "baby", searchTerm: "best selling baby products" },
  { name: "Kitchen", icon: Coffee, param: "kitchen", searchTerm: "best selling kitchen products" },
  { name: "Books", icon: BookOpen, param: "books", searchTerm: "best selling books" },
  { name: "Music", icon: Music, param: "music", searchTerm: "best selling music" },
];

interface IntegratedSearchSectionProps {
  onRecentSearchClick?: (search: string) => void;
}

const IntegratedSearchSection: React.FC<IntegratedSearchSectionProps> = ({
  onRecentSearchClick,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { recentSearches } = useUserSearchHistory();
  const selectedCategory = searchParams.get("category");
  const currentSearch = searchParams.get("search");

  const handleCategoryClick = (categoryParam: string, searchTerm: string) => {
    const newParams = new URLSearchParams(searchParams);
    
    // If clicking the same category, remove it (toggle off)
    if (selectedCategory === categoryParam) {
      newParams.delete("category");
      newParams.delete("search");
    } else {
      // Use the search term for better results
      if (searchTerm) {
        newParams.set("search", searchTerm);
      }
      newParams.set("category", categoryParam);
    }
    
    setSearchParams(newParams, { replace: true });
  };

  const handleRecentSearchClick = (term: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("search", term);
    // Clear category when performing a search to avoid conflicts
    newParams.delete("category");
    setSearchParams(newParams, { replace: true });
    
    if (onRecentSearchClick) {
      onRecentSearchClick(term);
    }
  };

  // Only show recent searches if there's no active category or search
  const shouldShowRecentSearches = recentSearches.length > 0 && !currentSearch;

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 py-3 space-y-3">
        {/* Categories Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">Categories:</span>
            {selectedCategory && (
              <span className="text-xs text-gray-500">
                (Clear to see other options)
              </span>
            )}
          </div>
          
          {isMobile ? (
            <Carousel
              opts={{
                align: "start",
                slidesToScroll: 1,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-1">
                {categories.map((category) => (
                  <CarouselItem key={category.param} className="pl-1 basis-auto">
                    <Button
                      variant={selectedCategory === category.param ? "default" : "outline"}
                      size="sm"
                      className="whitespace-nowrap h-8 px-3 flex items-center gap-1.5 text-xs"
                      onClick={() => handleCategoryClick(category.param, category.searchTerm)}
                    >
                      <category.icon className="h-3.5 w-3.5" />
                      {category.name}
                    </Button>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.param}
                  variant={selectedCategory === category.param ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-3 flex items-center gap-1.5 text-xs"
                  onClick={() => handleCategoryClick(category.param, category.searchTerm)}
                >
                  <category.icon className="h-3.5 w-3.5" />
                  {category.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Searches Section - only show when appropriate */}
        {shouldShowRecentSearches && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">Recent:</span>
            </div>
            
            <Carousel
              opts={{
                align: "start",
                slidesToScroll: isMobile ? 1 : 2,
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
        )}
      </div>
    </div>
  );
};

export default IntegratedSearchSection;
