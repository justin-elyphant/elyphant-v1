
import React from "react";
import { useSearchParams } from "react-router-dom";

// Category data structure
type CategoryItem = {
  id: string;
  name: string;
  icon: string;
  searchTerm: string;
  description?: string;
};

const GiftingCategories = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Sample categories
  const categories: CategoryItem[] = [
    {
      id: "birthday",
      name: "Birthday Gifts",
      icon: "🎁",
      searchTerm: "birthday gift ideas",
      description: "Special gifts for birthdays"
    },
    {
      id: "anniversary",
      name: "Anniversary",
      icon: "💑",
      searchTerm: "anniversary gift ideas",
      description: "Celebrate special moments"
    },
    {
      id: "wedding",
      name: "Wedding",
      icon: "💍",
      searchTerm: "wedding gift ideas",
      description: "Perfect wedding presents"
    },
    {
      id: "housewarming",
      name: "Housewarming",
      icon: "🏠",
      searchTerm: "housewarming gift ideas",
      description: "Welcome to new homes"
    },
    {
      id: "graduation",
      name: "Graduation",
      icon: "🎓",
      searchTerm: "graduation gift ideas",
      description: "Celebrate achievements"
    },
    {
      id: "holiday",
      name: "Holiday",
      icon: "🎄",
      searchTerm: "holiday gift ideas",
      description: "Seasonal gifting"
    }
  ];

  const handleCategoryClick = (searchTerm: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("search", searchTerm);
    setSearchParams(params);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Gift Categories</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {categories.map((category) => (
          <div 
            key={category.id}
            onClick={() => handleCategoryClick(category.searchTerm)}
            className="bg-white rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center text-center p-4"
          >
            <div className="text-3xl mb-2">{category.icon}</div>
            <h3 className="text-sm font-medium">{category.name}</h3>
            {category.description && (
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                {category.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GiftingCategories;
