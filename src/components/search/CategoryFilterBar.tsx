
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getDropdownCategories } from "@/constants/categories";

interface CategoryFilterBarProps {
  selectedCategory: string;
  onCategorySelect: (categoryValue: string) => void;
  mobile?: boolean;
}

const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  selectedCategory,
  onCategorySelect,
  mobile = false
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categories = getDropdownCategories();

  const handleCategoryClick = (categoryValue: string, searchTerm: string) => {
    onCategorySelect(categoryValue);
    
    // If there's a search term for this category, update the URL to include it
    // so it gets saved to recent searches
    if (searchTerm) {
      const params = new URLSearchParams(searchParams);
      params.set("search", searchTerm);
      if (categoryValue) {
        params.set("category", categoryValue);
      } else {
        params.delete("category");
      }
      navigate(`/marketplace?${params.toString()}`, { replace: true });
    }
  };

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <span className="text-sm text-gray-600 flex-shrink-0 mr-2">Categories:</span>
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => handleCategoryClick(category.value, category.searchTerm)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 touch-manipulation ${
              mobile ? "min-h-[44px] px-4" : ""
            } ${
              selectedCategory === category.value
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilterBar;
