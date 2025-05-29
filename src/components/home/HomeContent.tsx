
import React from "react";
import { useAuth } from "@/contexts/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProductProvider } from "@/contexts/ProductContext";
import HeroSection from "@/components/home/sections/HeroSection";
import FeaturesSection from "@/components/home/sections/FeaturesSection";
import HomeCTA from "@/components/home/sections/HomeCTA";
import FeaturedCollections from "@/components/home/sections/FeaturedCollections";
import FeaturedOccasions from "@/components/home/sections/FeaturedOccasions";
import FeaturedProductsSection from "@/components/home/sections/FeaturedProducts";
import PopularBrandsSection from "@/components/home/sections/PopularBrandsSection";
import SeasonalGiftGuide from "@/components/home/sections/SeasonalGiftGuide";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const HomeContent = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Sample collections data
  const collections = [
    {
      id: 1,
      name: "Gifts for Her",
      image: "/lovable-uploads/61d17bb8-5d3f-41b6-84fb-cfc08459461b.png",
      callToAction: "Shop Now",
      searchTerm: "gifts for women"
    },
    {
      id: 2,
      name: "Gifts for Him",
      image: "/lovable-uploads/99d6a4f4-681f-4904-98fb-7c29bafba9d2.png",
      callToAction: "Shop Now",
      searchTerm: "gifts for men"
    },
    {
      id: 3,
      name: "Gifts Under $50",
      image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?auto=format&fit=crop&w=600&q=80",
      callToAction: "Shop Now",
      searchTerm: "gifts under 50 dollars"
    },
    {
      id: 4,
      name: "Luxury Gifts",
      image: "/lovable-uploads/11e6a90d-fd1c-495d-91e3-6be61ea55a5f.png",
      callToAction: "Shop Luxury",
      searchTerm: "luxury gifts"
    }
  ];

  // Journey guide logic: new user onboarding steps
  const showJourneyGuide = user && localStorage.getItem("newSignUp") === "true";

  return (
    <ProductProvider>
      <div>
        {/* Hero Section */}
        <HeroSection />

        {/* Show onboarding journey for new signups */}
        {showJourneyGuide && (
          <div className="container mx-auto py-8 px-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-purple-800 mb-4">Welcome to Gift Giver!</h2>
              <p className="text-purple-700 mb-4">
                Now that you've created your account, here's what you can do next:
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-purple-200 rounded-full w-6 h-6 flex items-center justify-center text-purple-800 font-bold mr-3 mt-0.5">1</div>
                  <div>
                    <h3 className="font-semibold text-purple-800">Complete your profile</h3>
                    <p className="text-purple-700 text-sm mb-2">Add your interests and preferences to help others find perfect gifts for you.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-purple-300 text-purple-700 hover:bg-purple-100"
                      onClick={() => navigate("/profile-setup")}
                    >
                      Set up profile <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-purple-200 rounded-full w-6 h-6 flex items-center justify-center text-purple-800 font-bold mr-3 mt-0.5">2</div>
                  <div>
                    <h3 className="font-semibold text-purple-800">Create your first wishlist</h3>
                    <p className="text-purple-700 text-sm mb-2">Start adding items you'd love to receive to your wishlist.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-purple-300 text-purple-700 hover:bg-purple-100"
                      onClick={() => navigate("/wishlists")}
                    >
                      Create wishlist <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-purple-200 rounded-full w-6 h-6 flex items-center justify-center text-purple-800 font-bold mr-3 mt-0.5">3</div>
                  <div>
                    <h3 className="font-semibold text-purple-800">Explore gift ideas</h3>
                    <p className="text-purple-700 text-sm mb-2">Browse our curated marketplace for inspiration.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-purple-300 text-purple-700 hover:bg-purple-100"
                      onClick={() => navigate("/marketplace")}
                    >
                      Explore marketplace <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-purple-200 rounded-full w-6 h-6 flex items-center justify-center text-purple-800 font-bold mr-3 mt-0.5">4</div>
                  <div>
                    <h3 className="font-semibold text-purple-800">Take the interactive tour</h3>
                    <p className="text-purple-700 text-sm mb-2">Learn about all features with our guided onboarding experience.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-purple-300 text-purple-700 hover:bg-purple-100"
                      onClick={() => navigate("/onboarding")}
                    >
                      Start onboarding <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add extra space before Featured Collections */}
        <div className="mt-8">
          <FeaturedCollections collections={collections} />
        </div>

        {/* Occasions-Based Gift Collections */}
        <FeaturedOccasions />

        {/* Popular Brands section moved above Featured Products */}
        <PopularBrandsSection />

        {/* Trending Products Carousel */}
        <FeaturedProductsSection />

        {/* Seasonal Gift Guide */}
        <SeasonalGiftGuide />

        {/* Features Section */}
        <FeaturesSection />

        {/* Call to Action */}
        <HomeCTA />
      </div>
    </ProductProvider>
  );
};

export default HomeContent;
