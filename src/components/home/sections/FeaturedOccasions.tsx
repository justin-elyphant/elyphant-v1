import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Calendar, Heart, GraduationCap, Baby, PartyPopper, Dog } from "lucide-react";
import { toast } from "sonner";
import { searchProducts } from "@/components/marketplace/zinc/zincService";
import { useNavigate } from "react-router-dom";

const occasions = [
  {
    id: 1,
    name: "Birthdays",
    icon: <PartyPopper className="h-6 w-6 text-blue-500" />,
    description: "Find the perfect birthday gifts",
    category: "birthday",
    color: "bg-blue-50 border-blue-200",
    cta: "Gifts for Birthdays",
    searchTerm: "birthday gifts"
  },
  {
    id: 2,
    name: "Weddings",
    icon: <Heart className="h-6 w-6 text-pink-500" />,
    description: "Celebrate special unions",
    category: "wedding",
    color: "bg-pink-50 border-pink-200",
    cta: "Wedding Gift Ideas",
    searchTerm: "wedding gifts"
  },
  {
    id: 3,
    name: "Anniversaries",
    icon: <Calendar className="h-6 w-6 text-purple-500" />,
    description: "Commemorate years together",
    category: "anniversary",
    color: "bg-purple-50 border-purple-200",
    cta: "Anniversary Gifts",
    searchTerm: "anniversary gifts"
  },
  {
    id: 4,
    name: "Graduations",
    icon: <GraduationCap className="h-6 w-6 text-green-500" />,
    description: "Celebrate academic achievements",
    category: "graduation",
    color: "bg-green-50 border-green-200",
    cta: "Graduation Gift Ideas",
    searchTerm: "graduation gifts"
  },
  {
    id: 5,
    name: "Baby Showers",
    icon: <Baby className="h-6 w-6 text-yellow-500" />,
    description: "Welcome new arrivals",
    category: "baby_shower",
    color: "bg-yellow-50 border-yellow-200",
    cta: "Baby Shower Gifts",
    searchTerm: "baby shower gifts"
  },
  {
    id: 6,
    name: "Pet Gifts",
    icon: <Dog className="h-6 w-6 text-orange-500" />,
    description: "Spoil your furry friends",
    category: "pets",
    color: "bg-orange-50 border-orange-200",
    cta: "Gifts for Pets",
    searchTerm: "pet gifts"
  },
  {
    id: 7,
    name: "All Occasions",
    icon: <Gift className="h-6 w-6 text-teal-500" />,
    description: "Explore gifts for any event",
    category: "all",
    color: "bg-teal-50 border-teal-200",
    cta: "Browse All Gift Ideas",
    searchTerm: "popular gifts"
  },
];

const FeaturedOccasions = () => {
  const navigate = useNavigate();
  const [loadingOccasion, setLoadingOccasion] = useState<number | null>(null);
  const [fetchStatus, setFetchStatus] = useState<Record<number, string>>({});
  
  useEffect(() => {
    console.log("Fetch status updated:", fetchStatus);
  }, [fetchStatus]);
  
  const handleOccasionClick = async (category: string, occasionName: string, occasionId: number, searchTerm: string) => {
    if (loadingOccasion !== null) {
      return;
    }
    
    console.log(`FeaturedOccasions: Occasion clicked: ${category}, ${occasionName}, ID: ${occasionId}, searchTerm: ${searchTerm}`);
    
    setLoadingOccasion(occasionId);
    setFetchStatus(prev => ({...prev, [occasionId]: "starting"}));
    
    toast.success(`Exploring ${occasionName.toLowerCase()} gift ideas...`);
    
    try {
      if (searchTerm) {
        console.log(`Pre-fetching products for search term: ${searchTerm}`);
        setFetchStatus(prev => ({...prev, [occasionId]: "fetching"}));
        
        const results = await searchProducts(searchTerm, "50");
        console.log(`Fetched ${results.length} products for "${searchTerm}"`);
        setFetchStatus(prev => ({...prev, [occasionId]: `fetched ${results.length} products`}));
        
        if (results.length === 0) {
          console.error(`No products found for search term: ${searchTerm}`);
          setFetchStatus(prev => ({...prev, [occasionId]: "no products found"}));
        }
      }
    } catch (error) {
      console.error(`Error pre-fetching products for ${occasionName}:`, error);
      setFetchStatus(prev => ({...prev, [occasionId]: "error fetching"}));
    } finally {
      // Route to marketplace with appropriate search term - using navigate instead of direct URL change
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}`);
      
      setLoadingOccasion(null);
      setFetchStatus(prev => ({...prev, [occasionId]: "navigation complete"}));
    }
  };

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Featured Occasions</h2>
        <a 
          href="/marketplace" 
          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
        >
          View all categories
        </a>
      </div>
      
      {/* Shrink tiles & icons, grid has smaller gaps, smaller cards */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 md:gap-3 xl:gap-4">
        {occasions.map((occasion) => (
          <div 
            key={occasion.id} 
            onClick={() => handleOccasionClick(occasion.category, occasion.name, occasion.id, occasion.searchTerm)}
            className="cursor-pointer"
          >
            <Card className={`h-full hover:shadow-md transition-shadow border ${occasion.color} rounded-lg`}>
              <CardContent className="p-2 md:p-3 flex flex-col items-center text-center min-h-[110px] md:min-h-[120px] xl:min-h-[140px] justify-center">
                <div className="rounded-full p-1.5 bg-white shadow-sm mb-1 md:mb-2">
                  <span className="block">
                    {React.cloneElement(occasion.icon, {
                      className:
                        "h-5 w-5 md:h-6 md:w-6 " +
                        (occasion.icon.props.className || '')
                    })}
                  </span>
                </div>
                <h3 className="font-medium text-xs md:text-sm">{occasion.name}</h3>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{occasion.description}</p>
                <span className="text-[10px] md:text-xs font-medium text-purple-600 hover:text-purple-800 mt-1">
                  {loadingOccasion === occasion.id ? "Loading..." : occasion.cta}
                </span>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedOccasions;
