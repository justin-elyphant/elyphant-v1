import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { Slider } from "@/components/ui/slider";
import { BadgeCheck, Heart, Star } from "lucide-react";
import { SavedFilters } from "./ProductGrid";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { toast } from "sonner";

interface FiltersSidebarProps {
  activeFilters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  categories?: string[];
}

const FiltersSidebar = ({ activeFilters, onFilterChange, categories = [] }: FiltersSidebarProps) => {
  const isMobile = useIsMobile();
  const [priceValues, setPriceValues] = useState<[number, number]>(
    activeFilters.priceRange ? activeFilters.priceRange : [0, 1000]
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    activeFilters.categories || []
  );
  const [savedFilterProfiles, setSavedFilterProfiles] = useLocalStorage<{name: string, filters: SavedFilters}[]>(
    "savedFilters", []
  );
  const [filterProfileName, setFilterProfileName] = useState("");
  
  const handlePriceChange = (value: [number, number]) => {
    setPriceValues(value);
    const newFilters = { ...activeFilters, priceRange: value };
    onFilterChange(newFilters);
  };
  
  const handleFreeShippingChange = (checked: boolean) => {
    const newFilters = { ...activeFilters, freeShipping: checked };
    onFilterChange(newFilters);
  };
  
  const handleCategoryChange = (value: string) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(value) 
        ? prev.filter(cat => cat !== value)
        : [...prev, value];
      
      const newFilters = { ...activeFilters, categories: newCategories };
      onFilterChange(newFilters);
      return newCategories;
    });
  }
  
  const handleRatingChange = (value: string) => {
    const newFilters = { ...activeFilters, rating: Number(value) };
    onFilterChange(newFilters);
  };

  const handleFavoritesOnlyChange = (checked: boolean) => {
    const newFilters = { ...activeFilters, favoritesOnly: checked };
    onFilterChange(newFilters);
  };
  
  const saveCurrentFilters = () => {
    if (!filterProfileName) return;
    
    const filterProfile = {
      name: filterProfileName,
      filters: {
        priceRange: priceValues,
        categories: selectedCategories,
        ratings: activeFilters.rating || null,
        favorites: activeFilters.favoritesOnly || false
      }
    };
    
    setSavedFilterProfiles(prev => [...prev, filterProfile]);
    setFilterProfileName("");
    toast.success("Filter profile saved", {
      description: `Saved as "${filterProfileName}"`
    });
  };
  
  const loadFilterProfile = (profile: {name: string, filters: SavedFilters}) => {
    setPriceValues(profile.filters.priceRange);
    setSelectedCategories(profile.filters.categories);
    
    const newFilters = {
      priceRange: profile.filters.priceRange,
      categories: profile.filters.categories,
      rating: profile.filters.ratings,
      favoritesOnly: profile.filters.favorites,
      sortBy: activeFilters.sortBy
    };
    
    onFilterChange(newFilters);
  };
  
  return (
    <div className="bg-white border rounded-md overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-medium">Filters</h3>
      </div>
      
      <ScrollArea className={isMobile ? "h-[50vh] md:h-auto" : "h-auto max-h-[calc(100vh-200px)]"}>
        <div className="p-4 space-y-6">
          {/* Category filter - multi-select */}
          {categories.length > 0 && (
            <>
              <div>
                <h4 className="font-medium mb-3">Categories</h4>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`category-${category}`}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryChange(category)}
                      />
                      <Label 
                        htmlFor={`category-${category}`}
                        className="text-sm cursor-pointer"
                      >
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
            </>
          )}
          
          {/* Price range filter with slider */}
          <div>
            <h4 className="font-medium mb-3">Price Range</h4>
            <div className="mt-6 px-2">
              <Slider
                defaultValue={priceValues}
                value={priceValues}
                max={1000}
                step={10}
                onValueChange={(value: [number, number]) => handlePriceChange(value)}
                className="mb-6"
              />
              <div className="flex items-center justify-between">
                <div className="bg-primary/10 px-2 py-1 rounded text-xs font-medium">
                  ${priceValues[0]}
                </div>
                <div className="bg-primary/10 px-2 py-1 rounded text-xs font-medium">
                  ${priceValues[1]}
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Rating filter - enhanced */}
          <div>
            <h4 className="font-medium mb-3">Rating</h4>
            <RadioGroup 
              value={activeFilters.rating?.toString() || ""}
              onValueChange={handleRatingChange}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4" id="rating4" className="h-5 w-5" />
                <Label htmlFor="rating4" className="text-sm cursor-pointer flex items-center">
                  <span className="text-amber-500 mr-1 flex">
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                  </span>
                  & up
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3" id="rating3" className="h-5 w-5" />
                <Label htmlFor="rating3" className="text-sm cursor-pointer flex items-center">
                  <span className="text-amber-500 mr-1 flex">
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                  </span>
                  & up
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="rating2" className="h-5 w-5" />
                <Label htmlFor="rating2" className="text-sm cursor-pointer flex items-center">
                  <span className="text-amber-500 mr-1 flex">
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                  </span>
                  & up
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <Separator />
          
          {/* Special filters section */}
          <div>
            <h4 className="font-medium mb-3">Special Filters</h4>
            <div className="space-y-3">
              {/* Free shipping filter */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="freeShipping" 
                  checked={activeFilters.freeShipping || false}
                  onCheckedChange={handleFreeShippingChange}
                />
                <Label htmlFor="freeShipping" className="text-sm cursor-pointer flex items-center">
                  <BadgeCheck className="h-4 w-4 mr-1.5 text-green-500" />
                  Free shipping
                </Label>
              </div>
              
              {/* Favorites only filter */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="favoritesOnly" 
                  checked={activeFilters.favoritesOnly || false}
                  onCheckedChange={handleFavoritesOnlyChange}
                />
                <Label htmlFor="favoritesOnly" className="text-sm cursor-pointer flex items-center">
                  <Heart className="h-4 w-4 mr-1.5 text-red-500" />
                  Favorites only
                </Label>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Saved filter profiles */}
          {savedFilterProfiles.length > 0 && (
            <>
              <div>
                <h4 className="font-medium mb-3">Saved Filters</h4>
                <div className="space-y-2">
                  {savedFilterProfiles.map((profile, idx) => (
                    <Button 
                      key={idx} 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start text-left"
                      onClick={() => loadFilterProfile(profile)}
                    >
                      {profile.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Separator />
            </>
          )}
          
          {/* Save current filters */}
          <div>
            <h4 className="font-medium mb-3">Save Current Filters</h4>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border rounded px-2 py-1 text-sm"
                placeholder="Filter Profile Name"
                value={filterProfileName}
                onChange={(e) => setFilterProfileName(e.target.value)}
              />
              <Button 
                size="sm" 
                variant="secondary"
                onClick={saveCurrentFilters}
                disabled={!filterProfileName}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onFilterChange({
            priceRange: [0, 1000],
            categories: [],
            rating: null,
            freeShipping: false,
            favoritesOnly: false,
            sortBy: activeFilters.sortBy || "relevance"
          })}
          className="w-full"
        >
          Clear All Filters
        </Button>
      </div>
    </div>
  );
};

export default FiltersSidebar;
