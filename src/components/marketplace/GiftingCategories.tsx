
import React from "react";
import { useSearchParams } from "react-router-dom";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Category {
  id: string;
  name: string;
  image: string;
  searchTerm: string;
  color?: string;
}

const GiftingCategories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useProfile();
  const isMobile = useIsMobile();
  
  // Extract user interests from profile
  const userInterests = profile?.gift_preferences || [];
  const interests = Array.isArray(userInterests) 
    ? userInterests.map(pref => typeof pref === 'string' ? pref : pref.category).filter(Boolean)
    : [];
  
  // Enhanced categories with color coding
  const categories: Category[] = [
    {
      id: "travelers",
      name: "For Travelers",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      searchTerm: "travel gift",
      color: "from-blue-50 to-blue-100 border-blue-200"
    },
    {
      id: "pet-lovers",
      name: "For Pet Lovers",
      image: "https://images.unsplash.com/photo-1543852786-1cf6624b9987",
      searchTerm: "pet gift",
      color: "from-amber-50 to-amber-100 border-amber-200"
    },
    {
      id: "foodies",
      name: "For Foodies",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
      searchTerm: "cooking gift",
      color: "from-green-50 to-green-100 border-green-200"
    },
    {
      id: "tech-enthusiasts",
      name: "For Tech Enthusiasts",
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
      searchTerm: "tech gift",
      color: "from-indigo-50 to-indigo-100 border-indigo-200"
    },
    {
      id: "fitness-fans",
      name: "For Fitness Fans",
      image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438",
      searchTerm: "fitness gift",
      color: "from-purple-50 to-purple-100 border-purple-200"
    },
    {
      id: "self-care",
      name: "Self-Care Gifts",
      image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881",
      searchTerm: "self care gift",
      color: "from-pink-50 to-pink-100 border-pink-200"
    },
    {
      id: "sustainable",
      name: "Sustainable Gifts",
      image: "https://placehold.co/300x300/e2e8f0/64748b?text=Eco+Friendly",
      searchTerm: "eco friendly gift",
      color: "from-teal-50 to-teal-100 border-teal-200"
    },
    {
      id: "budget-friendly",
      name: "Under $50",
      image: "https://placehold.co/300x300/e2e8f0/64748b?text=$50",
      searchTerm: "affordable gift",
      color: "from-gray-50 to-gray-100 border-gray-200"
    },
  ];

  // Check if a category matches any user interest
  const isRelevantToUser = (category: Category): boolean => {
    if (!interests.length) return false;
    
    const categoryKeywords = [
      category.id, 
      category.name.toLowerCase(), 
      category.searchTerm.toLowerCase()
    ];
    
    return interests.some(interest => 
      categoryKeywords.some(keyword => 
        keyword.includes(interest.toLowerCase()) || interest.toLowerCase().includes(keyword)
      )
    );
  };

  const handleCategoryClick = (searchTerm: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("search", searchTerm);
    setSearchParams(params);
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Browse Categories</h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {categories.map((category) => {
          const isRelevant = isRelevantToUser(category);
          
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.searchTerm)}
              className={cn(
                "flex flex-col items-center rounded-lg overflow-hidden bg-gradient-to-b border hover:shadow-md transition-all h-full",
                isRelevant ? `${category.color} border-purple-300` : `${category.color || "from-gray-50 to-gray-100 border-gray-200"}`,
                "animate-fade-in"
              )}
            >
              <div className="w-full aspect-square overflow-hidden">
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform hover:scale-110 duration-300"
                />
              </div>
              <div className={cn(
                "py-2 px-1 text-center w-full",
                isRelevant ? "bg-purple-100/50" : ""
              )}>
                <span className={cn(
                  "text-xs sm:text-sm font-medium",
                  isRelevant ? "text-purple-700" : "text-gray-700"
                )}>
                  {category.name}
                  {isRelevant && ' ★'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GiftingCategories;
