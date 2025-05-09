
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";

// Simple component to render just category buttons for various gift categories
const GiftingCategories = () => {
  const isMobile = useIsMobile();
  
  // Categories with emojis for visual recognition
  const categories = [
    { name: "Birthday", emoji: "🎂" },
    { name: "Anniversary", emoji: "💍" },
    { name: "Wedding", emoji: "💒" },
    { name: "Baby", emoji: "👶" },
    { name: "Graduation", emoji: "🎓" },
    { name: "Holiday", emoji: "🎄" },
    { name: "Thank You", emoji: "🙏" },
    { name: "Just Because", emoji: "💝" },
  ];

  // Adjust number of visible categories based on screen size
  const visibleCategories = isMobile ? categories.slice(0, 4) : categories;
  
  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-medium">Popular Categories</h2>
        {isMobile && (
          <button className="text-purple-600 text-sm font-medium">See All</button>
        )}
      </div>
      
      <div className="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2">
        {visibleCategories.map(category => (
          <div 
            key={category.name}
            className="bg-white border border-gray-200 hover:border-purple-300 rounded-lg p-2 sm:p-3 text-center cursor-pointer transition-colors"
          >
            <div className="text-xl sm:text-2xl mb-1">{category.emoji}</div>
            <div className="text-xs sm:text-sm font-medium">{category.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GiftingCategories;
