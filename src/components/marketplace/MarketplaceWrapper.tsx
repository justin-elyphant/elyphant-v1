
import React, { useEffect, useState } from "react";
import { useMarketplaceProducts } from "./hooks/useMarketplaceProducts";
import { useProductTracking } from "./hooks/useProductTracking";
import { useSearchParams } from "react-router-dom";
import { useProductDataSync } from "@/hooks/useProductDataSync";

import MarketplaceHeader from "./MarketplaceHeader";
import GiftingCategories from "./GiftingCategories";
import MarketplaceContent from "./MarketplaceContent";
import RecentlyViewedProducts from "./RecentlyViewedProducts";
import OccasionMessage from "./header/OccasionMessage";
import OccasionCards from "./header/OccasionCards";
import StickyFiltersBar from "./StickyFiltersBar";
import { getUpcomingOccasions, getNextHoliday } from "./utils/upcomingOccasions";
import { useConnectedFriendsSpecialDates } from "@/hooks/useConnectedFriendsSpecialDates";
import { useNavigate } from "react-router-dom";
import ContentMarketing from "./ContentMarketing";
import PersonalizedRecommendations from "./PersonalizedRecommendations";
import LoyaltyPoints from "../loyalty/LoyaltyPoints";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserPreferences from "./UserPreferences";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Gift, Heart, User, Users, Settings } from "lucide-react";

const MarketplaceWrapper = () => {
  const { 
    searchTerm, 
    setSearchTerm, 
    isLoading, 
    products,
    onSearch 
  } = useMarketplaceProducts();
  
  // Initialize product tracking
  const { trackProductViewById } = useProductTracking(products);
  const { forceSyncNow } = useProductDataSync();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // UI state
  const [showFilters, setShowFilters] = useState(true);
  const [marketplaceTab, setMarketplaceTab] = useState("discover");
  
  // Occasion state for the hero banner
  const [currentOccasionIndex, setCurrentOccasionIndex] = useState(0);
  const [animationState, setAnimationState] = useState<"in" | "out">("in");
  const { friendOccasions, loading: loadingFriendOccasions } = useConnectedFriendsSpecialDates();
  
  // Get holiday occasions
  const holidayOccasions = getUpcomingOccasions();
  const nextHoliday = holidayOccasions.length > 0 ? holidayOccasions[0] : null;
  const secondHoliday = holidayOccasions.length > 1 ? holidayOccasions[1] : null;
  
  // Combine all occasions for the rotation
  const allOccasions = [...holidayOccasions, ...friendOccasions].sort((a, b) => 
    a.date.getTime() - b.date.getTime()
  );
  
  // Handle the occasion message rotation
  useEffect(() => {
    if (allOccasions.length === 0) return;
    
    const rotationInterval = setInterval(() => {
      setAnimationState("out");
      
      setTimeout(() => {
        setCurrentOccasionIndex((prev) => 
          prev + 1 >= allOccasions.length ? 0 : prev + 1
        );
        setAnimationState("in");
      }, 500); // Wait for fade out animation
    }, 5000); // Rotate every 5 seconds
    
    return () => clearInterval(rotationInterval);
  }, [allOccasions]);
  
  // Track product view when component mounts or URL parameters change
  useEffect(() => {
    const productId = searchParams.get("productId");
    if (productId) {
      console.log("MarketplaceWrapper: Tracking product view for ID:", productId);
      trackProductViewById(productId);
    }
    
    // Set the active tab based on URL parameters
    const tabParam = searchParams.get("tab");
    if (tabParam && ["discover", "guides", "preferences", "rewards"].includes(tabParam)) {
      setMarketplaceTab(tabParam);
    }
  }, [searchParams, trackProductViewById]);
  
  // Force sync when component unmounts
  useEffect(() => {
    return () => {
      // Ensure any pending product views are synced
      forceSyncNow();
    };
  }, [forceSyncNow]);

  // Handle occasion card clicks
  const handleOccasionCardClick = (searchQuery: string, personId?: string, occasionType?: string) => {
    setSearchTerm(searchQuery);
    onSearch(searchQuery);
    
    if (personId) {
      console.log(`Searching for gifts for person ID: ${personId}, occasion: ${occasionType}`);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setMarketplaceTab(tab);
    
    // Update URL parameters
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set("tab", tab);
      return newParams;
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero banner with upcoming occasions */}
      <div className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100 shadow-sm">
        <div className="flex flex-col gap-3">
          {/* Rotating occasion message */}
          <div className="h-8">
            {allOccasions.length > 0 && (
              <OccasionMessage 
                occasion={allOccasions[currentOccasionIndex]} 
                animationState={animationState} 
              />
            )}
          </div>
          
          {/* Occasion cards grid */}
          <OccasionCards 
            friendOccasions={friendOccasions}
            nextHoliday={nextHoliday}
            secondHoliday={secondHoliday}
            onCardClick={handleOccasionCardClick}
          />
        </div>
      </div>
      
      <MarketplaceHeader 
        totalResults={products.length}
      />
      
      {/* New tabs for Marketplace navigation */}
      <Tabs
        value={marketplaceTab}
        onValueChange={handleTabChange}
        className="w-full mb-6"
      >
        <TabsList className="flex w-full justify-start mb-6 overflow-x-auto hide-scrollbar">
          <TabsTrigger value="discover" className="flex items-center">
            <Gift className="h-4 w-4 mr-2" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="guides" className="flex items-center">
            <Heart className="h-4 w-4 mr-2" />
            Gift Guides
          </TabsTrigger>
          {user && (
            <>
              <TabsTrigger value="preferences" className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="rewards" className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Rewards
              </TabsTrigger>
            </>
          )}
        </TabsList>
        
        <TabsContent value="discover">
          {/* Sticky search and filters bar */}
          <StickyFiltersBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={onSearch}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            totalItems={products.length}
          />
          
          {/* Enhanced visual categories section */}
          <GiftingCategories />
          
          {/* Featured Curated Collections */}
          <ContentMarketing
            title="Featured Gift Collections"
            description="Expertly curated gift ideas for every occasion"
            variant="featured"
          />
          
          {/* Main products grid with filters */}
          <MarketplaceContent 
            products={products}
            isLoading={isLoading}
            searchTerm={searchTerm}
            onProductView={trackProductViewById}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />
          
          {/* Personalized recommendations section */}
          <PersonalizedRecommendations 
            products={products}
            title="Just For You"
            description="Recommendations based on your interests and browsing history"
            limit={6}
          />
          
          {/* Enhanced recently viewed products section */}
          <RecentlyViewedProducts />
          
          {/* Mini loyalty points summary if user is logged in */}
          {user && (
            <div className="mt-8">
              <LoyaltyPoints expanded={false} />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="guides">
          <div className="space-y-8">
            {/* Hero section for Gift Guides */}
            <div className="relative rounded-xl overflow-hidden h-48 md:h-64">
              <img 
                src="https://images.unsplash.com/photo-1513885535751-8b9238bd345a?ixlib=rb-4.0.3"
                alt="Gift Guides Hero"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                <div className="p-6 md:p-10 text-white max-w-lg">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">Curated Gift Guides</h1>
                  <p className="text-sm md:text-base">Find the perfect gift with our expertly curated collections for every occasion and interest</p>
                </div>
              </div>
            </div>
            
            {/* Seasonal Collections */}
            <ContentMarketing
              title="Seasonal Collections"
              description="Perfect gifts for upcoming holidays and special occasions"
              variant="grid"
            />
            
            {/* Interest-Based Collections */}
            <ContentMarketing
              title="For Every Interest"
              description="Gift guides based on hobbies and interests"
              variant="horizontal"
            />
            
            {/* Budget-Friendly Collections */}
            <ContentMarketing
              title="Gift Guides by Budget"
              description="Find the perfect gift in your price range"
              variant="grid"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="preferences">
          {user ? (
            <div className="max-w-2xl mx-auto">
              <UserPreferences />
            </div>
          ) : (
            <div className="text-center py-10">
              <h2 className="text-xl font-semibold mb-4">Sign In to Save Your Preferences</h2>
              <p className="text-muted-foreground mb-6">Create an account to personalize your shopping experience</p>
              <Button onClick={() => navigate("/auth")}>Sign In</Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="rewards">
          {user ? (
            <div className="max-w-2xl mx-auto">
              <LoyaltyPoints expanded={true} />
            </div>
          ) : (
            <div className="text-center py-10">
              <h2 className="text-xl font-semibold mb-4">Sign In to Access Your Rewards</h2>
              <p className="text-muted-foreground mb-6">Create an account to start earning reward points with every purchase</p>
              <Button onClick={() => navigate("/auth")}>Sign In</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketplaceWrapper;
