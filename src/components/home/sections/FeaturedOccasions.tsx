
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Calendar, Heart, GraduationCap, Baby, PartyPopper, Dog } from "lucide-react";
import { useProducts } from "@/contexts/ProductContext";
import { guessCategory } from "@/components/marketplace/zinc/utils/categoryUtils";
import { toast } from "sonner";

const occasions = [
  {
    id: 1,
    name: "Birthdays",
    icon: <PartyPopper className="h-6 w-6 text-blue-500" />,
    description: "Find the perfect birthday gifts",
    category: "birthday",
    color: "bg-blue-50 border-blue-200",
    cta: "Gifts for Birthdays"
  },
  {
    id: 2,
    name: "Weddings",
    icon: <Heart className="h-6 w-6 text-pink-500" />,
    description: "Celebrate special unions",
    category: "wedding",
    color: "bg-pink-50 border-pink-200",
    cta: "Wedding Gift Ideas"
  },
  {
    id: 3,
    name: "Anniversaries",
    icon: <Calendar className="h-6 w-6 text-purple-500" />,
    description: "Commemorate years together",
    category: "anniversary",
    color: "bg-purple-50 border-purple-200",
    cta: "Anniversary Gifts"
  },
  {
    id: 4,
    name: "Graduations",
    icon: <GraduationCap className="h-6 w-6 text-green-500" />,
    description: "Celebrate academic achievements",
    category: "graduation",
    color: "bg-green-50 border-green-200",
    cta: "Graduation Gift Ideas"
  },
  {
    id: 5,
    name: "Baby Showers",
    icon: <Baby className="h-6 w-6 text-yellow-500" />,
    description: "Welcome new arrivals",
    category: "baby_shower",
    color: "bg-yellow-50 border-yellow-200",
    cta: "Baby Shower Gifts"
  },
  {
    id: 6,
    name: "Pet Gifts",
    icon: <Dog className="h-6 w-6 text-orange-500" />,
    description: "Spoil your furry friends",
    category: "pets",
    color: "bg-orange-50 border-orange-200",
    cta: "Gifts for Pets"
  },
  {
    id: 7,
    name: "All Occasions",
    icon: <Gift className="h-6 w-6 text-teal-500" />,
    description: "Explore gifts for any event",
    category: "all",
    color: "bg-teal-50 border-teal-200",
    cta: "Browse All Gift Ideas"
  },
];

const FeaturedOccasions = () => {
  const [loadingOccasion, setLoadingOccasion] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const handleOccasionClick = (e: React.MouseEvent, category: string, occasionName: string) => {
    e.preventDefault(); // Prevent default navigation
    
    if (loadingOccasion) {
      // Prevent multiple clicks while loading
      return;
    }
    
    console.log(`FeaturedOccasions: Occasion clicked: ${category}, ${occasionName}`);
    
    // Set loading state for this specific occasion
    setLoadingOccasion(category);
    
    // Add a small delay to show the loading state and then navigate
    setTimeout(() => {
      // Clear loading state
      setLoadingOccasion(null);
      
      // Show feedback to the user
      toast.success(`Exploring ${occasionName.toLowerCase()} gift ideas...`);
        
      // Navigate to the gifting page with the appropriate category
      if (category === "all") {
        navigate(`/gifting?tab=products`);
      } else {
        navigate(`/gifting?tab=products&category=${category}`);
      }
    }, 300);
  };

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Featured Occasions</h2>
        <Link to="/gifting?tab=products" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
          View all categories
        </Link>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {occasions.map((occasion) => (
          <div 
            key={occasion.id} 
            onClick={(e) => handleOccasionClick(e, occasion.category, occasion.name)}
            className="cursor-pointer"
          >
            <Card className={`h-full hover:shadow-md transition-shadow border ${occasion.color}`}>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="rounded-full p-3 bg-white shadow-sm mb-3">
                  {occasion.icon}
                </div>
                <h3 className="font-medium">{occasion.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{occasion.description}</p>
                <span className="text-xs font-medium text-purple-600 hover:text-purple-800 mt-2">
                  {loadingOccasion === occasion.category ? "Loading..." : occasion.cta}
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
