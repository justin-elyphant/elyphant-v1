import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { BadgeCheck, Heart, Star } from "lucide-react";
import { SavedFilters } from "./ProductGrid";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import FriendWishlistSelector from "./FriendWishlistSelector";
import { supabase } from "@/integrations/supabase/client";

interface FiltersSidebarProps {
  activeFilters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  categories?: string[];
  isMobile?: boolean;
}

const OCCASION_KEYWORDS = [
  "fathers-day", "mothers-day", "valentines-day", "anniversary", "holiday",
  "christmas", "thanksgiving", "hanukkah", "easter", "new-year", "birthday",
  "wedding", "graduation", "baby-shower", "bridal-shower", "engagement",
  "father", "mother", "dad", "mom", "child", "children", "kid", "kids", "baby",
  "grandparent", "grandfather", "grandmother", "uncle", "aunt", "cousin"
];

// Helper: detect "generic" friend/family IDs like friend-1, uncle-3, dad-2, etc.
const GENERIC_LABELS = [
  "friend", "uncle", "aunt", "cousin", "dad", "mom", "father", "mother", "brother",
  "sister", "son", "daughter", "child", "children", "kid", "kids", "baby",
  "grandparent", "grandfather", "grandmother",
  "coworker", "colleague", "boss", "teacher", "partner", "spouse"
];

function isGenericPersonId(personId: string) {
  if (!personId) return false;
  // Matches e.g. "friend-3", "uncle-2", "mom-5"
  const genericPattern = new RegExp(`^(${GENERIC_LABELS.join("|")})-\\d+$`, "i");
  return genericPattern.test(personId);
}

const isOccasionPersonId = (personId: string) => {
  if (!personId) return false;
  // occasion/role keywords are often kebab-case or lowercased
  const normalized = personId.toLowerCase().replace(/[^a-z\-]/g, "");
  // strict match against list or "occasion" in id
  const matchesOccasion = OCCASION_KEYWORDS.some((kw) =>
    normalized === kw ||
    normalized === `${kw}-id` ||
    normalized.includes(kw) ||
    normalized.startsWith(kw)
  );
  // Also treat generic-ids like friend-2, uncle-3 as occasions, so filter is hidden
  return matchesOccasion || isGenericPersonId(personId);
};

// Helper to try to extract a person's name from the search string
function getPersonNameFromSearch(search: string): string | null {
  if (!search) return null;
  // Examples to match: "Michael Davis birthday gift", "Sarah graduation gift"
  // We'll attempt to extract the (likely) name if it's at the start
  const namePattern = /^([A-Za-z'-]+ [A-Za-z'-]+|[A-Za-z'-]+)(?:'s)? (\w+ )?gift/i;
  const match = decodeURIComponent(search).trim().match(namePattern);
  if (match) {
    return match[1].trim();
  }
  return null;
}

// Utility: determines if a search string is an occasion/holiday, e.g. "Father's Day gifts"
function isOccasionSearchTerm(search: string): boolean {
  if (!search) return false;
  const normalized = decodeURIComponent(search).toLowerCase().replace(/[^a-z0-9\- ]/g, "");

  // Return true if any keyword is matched within first 30 chars
  return OCCASION_KEYWORDS.some(kw =>
    normalized.startsWith(kw.replace(/-/g, " ")) ||
    // Occasion like "father day gifts", "mothers day", "birthday", etc
    normalized.includes(kw) ||
    normalized.startsWith(kw)
  );
}

const FiltersSidebar = ({ 
  activeFilters, 
  onFilterChange, 
  categories = [],
  isMobile = false
}: FiltersSidebarProps) => {
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

  // Wishlist selector state
  const [friendWishlists, setFriendWishlists] = useState<{ id: string; title: string }[]>([]);
  const [selectedWishlistId, setSelectedWishlistId] = useState<string | "all">("all");
  // Reset selected wishlist if friend changes
  const [friendWishlistName, setFriendWishlistName] = useState<string | null>(null);
  const [showFullWishlist, setShowFullWishlist] = useState(false);

  // --- Detect friend wishlist context (mostly unchanged) ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const personId = urlParams.get("personId");
    const rawSearchTerm = urlParams.get("search") || "";

    let showWishlist = false;
    let friendName: string | null = null;

    const nameFromSearch = getPersonNameFromSearch(rawSearchTerm);
    const isOccasion = isOccasionPersonId(personId || "");
    const isOccasionSearch = isOccasionSearchTerm(rawSearchTerm);

    /**
     * Logic:
     * 1. If a real person's name is present in the search string, show friend wishlist option.
     * 2. If not, only show if NOT an occasion/generic AND NOT an occasion-style search.
     * 3. For anything occasion-related (Father's Day, Christmas, etc) or generic friend/role-only, hide filter.
     */
    if (personId) {
      if (nameFromSearch) {
        // Detected real person name in search, always show
        friendName = nameFromSearch;
        showWishlist = true;
      } else if (!isOccasion && !isOccasionSearch) {
        // Not a generic/occasion person and search is not occasion
        friendName = "Friend";
        showWishlist = true;
      } else {
        // Do not show filter for occasion/generic or occasion search
        friendName = null;
        showWishlist = false;
      }
    }

    if (showWishlist && friendName) {
      setFriendWishlistName(friendName);
    } else {
      setFriendWishlistName(null);
    }
    setShowFullWishlist(false);
    // Reset wishlist list and selected list when switching context
    setFriendWishlists([]);
    setSelectedWishlistId("all");
    // eslint-disable-next-line
  }, [window.location.search]);

  // --- Fetch giftee's wishlists from Supabase if personId is present & real ---
  useEffect(() => {
    // Only attempt if friendWishlistName and personId exist, and personId is not generic/occasion
    const urlParams = new URLSearchParams(window.location.search);
    const personId = urlParams.get("personId");

    if (friendWishlistName && personId && !isOccasionPersonId(personId)) {
      // Fetch wishlists from Supabase
      async function fetchWishlists() {
        // This assumes personId is a supabase user id or a mappable profile id
        const { data, error } = await supabase
          .from("wishlists")
          .select("id, title")
          .eq("user_id", personId)
          .order("created_at", { ascending: false });

        if (error) {
          setFriendWishlists([]);
          return;
        }
        setFriendWishlists(data || []);
      }
      fetchWishlists();
    }
  }, [friendWishlistName]);

  // --- WHEN TO SHOW THE FRIEND'S WISHLIST SELECTOR ---
  const shouldShowFriendWishlistSelector = friendWishlistName && friendWishlists.length > 0;

  // --- When a friend wishlist list is chosen ---
  const handleFriendWishlistSelect = (wishlistId: string | "all") => {
    setSelectedWishlistId(wishlistId);

    // Propagate selection up to product filtering context
    onFilterChange({ ...activeFilters, friendWishlistId: wishlistId });
  };

  const handleShowFullWishlistToggle = () => {
    setShowFullWishlist((prev) => {
      const newValue = !prev;
      // Inform parent that it should update friend wishlist mode
      onFilterChange({ ...activeFilters, showFullWishlist: newValue });
      return newValue;
    });
  };

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
  
  const clearFilters = () => {
    setPriceValues([0, 1000]);
    setSelectedCategories([]);
    
    onFilterChange({
      priceRange: [0, 1000],
      categories: [],
      rating: null,
      freeShipping: false,
      favoritesOnly: false,
      sortBy: activeFilters.sortBy || "relevance"
    });
  };
  
  // Count active filters for badge display
  const countActiveFilters = () => {
    let count = 0;
    if (selectedCategories.length > 0) count += 1;
    if (priceValues[0] > 0 || priceValues[1] < 1000) count += 1;
    if (activeFilters.rating) count += 1;
    if (activeFilters.freeShipping) count += 1;
    if (activeFilters.favoritesOnly) count += 1;
    return count;
  };
  
  const activeFilterCount = countActiveFilters();
  
  return (
    <div className="bg-white border rounded-md overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-medium flex items-center">
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </h3>
        {activeFilterCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-xs"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Friend wishlist logic block */}
      {friendWishlistName && (
        <div className="p-4 border-b flex flex-col gap-4 bg-white">
          <div className="flex items-center justify-between">
            <span className="font-medium text-black inline-flex items-center">
              {showFullWishlist ? `Showing all of ${friendWishlistName}'s wishlist` : `Show all of ${friendWishlistName}'s wishlist`}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="ml-2 border border-gray-200 text-base font-semibold"
              onClick={handleShowFullWishlistToggle}
            >
              <span className="text-primary font-semibold">
                {showFullWishlist ? "Hide" : "Show All"}
              </span>
            </Button>
          </div>
          {/* Moved: Dropdown appears whenever we have wishlists for the friend → always visible */}
          {shouldShowFriendWishlistSelector && (
            <FriendWishlistSelector
              wishlists={friendWishlists}
              selectedWishlistId={selectedWishlistId}
              onSelect={handleFriendWishlistSelect}
            />
          )}
        </div>
      )}

      <ScrollArea className={isMobile ? "h-[60vh]" : "max-h-[calc(100vh-200px)]"}>
        <div className="p-4 space-y-5">
          {/* Category filter with responsive grid for mobile */}
          {categories.length > 0 && (
            <>
              <div>
                <h4 className="font-medium mb-3">Categories</h4>
                <div className={isMobile 
                  ? "grid grid-cols-2 gap-2" 
                  : "space-y-2"
                }>
                  {categories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`category-${category}`}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryChange(category)}
                      />
                      <Label 
                        htmlFor={`category-${category}`}
                        className="text-sm cursor-pointer truncate"
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
            <div className="mt-4 px-2">
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
                  ${priceValues[1] === 1000 ? "$1000+" : `$${priceValues[1]}`}
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Rating filter - enhanced and mobile-friendly */}
          <div>
            <h4 className="font-medium mb-3">Rating</h4>
            <RadioGroup 
              value={activeFilters.rating?.toString() || ""}
              onValueChange={handleRatingChange}
              className={isMobile ? "grid grid-cols-3 gap-2" : "space-y-2"}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4" id="rating4" className="h-4 w-4" />
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
                <RadioGroupItem value="3" id="rating3" className="h-4 w-4" />
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
                <RadioGroupItem value="2" id="rating2" className="h-4 w-4" />
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
          
          {/* Special filters section - mobile friendly with grid layout */}
          <div>
            <h4 className="font-medium mb-3">Special Filters</h4>
            <div className={isMobile ? "grid grid-cols-2 gap-3" : "space-y-3"}>
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
          
          {/* Saved filter profiles */}
          {savedFilterProfiles.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Saved Filters</h4>
                <div className={isMobile ? "grid grid-cols-2 gap-2" : "space-y-2"}>
                  {savedFilterProfiles.map((profile, idx) => (
                    <Button 
                      key={idx} 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start text-left text-xs"
                      onClick={() => loadFilterProfile(profile)}
                    >
                      {profile.name}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {/* Save current filters - mobile friendly design */}
          <Separator />
          <div>
            <h4 className="font-medium mb-2">Save Current Filters</h4>
            <div className="flex gap-2 mt-1">
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
                className="whitespace-nowrap"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default FiltersSidebar;
