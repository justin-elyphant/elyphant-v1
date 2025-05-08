
import React from "react";
import { useSearchParams } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  image: string;
  searchTerm: string;
}

const GiftingCategories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
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
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09",
      searchTerm: "eco friendly gift"
    },
    {
      id: "budget-friendly",
      name: "Under $50",
      image: "https://images.unsplash.com/photo-1607082350899-7e105aa886ae",
      searchTerm: "affordable gift"
    },
  ];

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
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.searchTerm)}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-full pl-1 pr-4 py-1 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img 
                src={category.image} 
                alt={category.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm font-medium">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GiftingCategories;
