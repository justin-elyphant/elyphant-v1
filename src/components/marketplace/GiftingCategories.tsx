
import React from "react";
import { useSearchParams } from "react-router-dom";
import { useProfile } from "@/contexts/profile/ProfileContext";

interface Category {
  id: string;
  name: string;
  image: string;
  searchTerm: string;
}

const GiftingCategories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useProfile();
  
  // Extract user interests from profile
  const userInterests = profile?.gift_preferences || [];
  const interests = Array.isArray(userInterests) 
    ? userInterests.map(pref => typeof pref === 'string' ? pref : pref.category).filter(Boolean)
    : [];
  
  const categories: Category[] = [
    {
      id: "travelers",
      name: "For Travelers",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      searchTerm: "travel gift"
    },
    {
      id: "pet-lovers",
      name: "For Pet Lovers",
      image: "https://images.unsplash.com/photo-1543852786-1cf6624b9987",
      searchTerm: "pet gift"
    },
    {
      id: "foodies",
      name: "For Foodies",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
      searchTerm: "cooking gift"
    },
    {
      id: "tech-enthusiasts",
      name: "For Tech Enthusiasts",
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
      searchTerm: "tech gift"
    },
    {
      id: "fitness-fans",
      name: "For Fitness Fans",
      image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438",
      searchTerm: "fitness gift"
    },
    {
      id: "self-care",
      name: "Self-Care Gifts",
      image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881",
      searchTerm: "self care gift"
    },
    {
      id: "sustainable",
      name: "Sustainable Gifts",
      image: "https://placehold.co/300x300/e2e8f0/64748b?text=Eco+Friendly",
      searchTerm: "eco friendly gift"
    },
    {
      id: "budget-friendly",
      name: "Under $50",
      image: "https://placehold.co/300x300/e2e8f0/64748b?text=$50",
      searchTerm: "affordable gift"
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
        <h2 className="text-2xl font-semibold tracking-tight">Browse Gift Categories</h2>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => {
          const isRelevant = isRelevantToUser(category);
          
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.searchTerm)}
              className={`flex items-center gap-2 bg-white border rounded-full pl-1 pr-4 py-1 hover:shadow-md transition-all cursor-pointer ${
                isRelevant ? 'border-purple-400 bg-purple-50' : 'border-gray-200'
              }`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img 
                  src={category.image} 
                  alt={category.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className={`text-sm font-medium ${isRelevant ? 'text-purple-700' : ''}`}>
                {category.name}
                {isRelevant && ' ★'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GiftingCategories;
