import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { UNIVERSAL_CATEGORIES } from "@/constants/categories";

const CategoryOverview: React.FC = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (category: string, searchTerm: string) => {
    // Enhanced category navigation with brand diversity flag
    if (searchTerm) {
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}&category=${encodeURIComponent(category)}&diversity=true`, 
        { state: { fromCategoryOverview: true, enableBrandDiversity: true } });
    } else {
      // Fallback to category-based navigation
      navigate(`/marketplace?category=${encodeURIComponent(category)}&diversity=true`, 
        { state: { fromCategoryOverview: true, enableBrandDiversity: true } });
    }
  };

  return (
    <div className="mb-8 md:mb-12">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          Browse All Categories
        </h2>
        <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
          Discover thousands of products across all our categories
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {UNIVERSAL_CATEGORIES.map((category) => (
          <div
            key={category.id}
            className="group relative p-3 md:p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-200 h-full touch-target-48 touch-manipulation flex flex-col"
            onClick={() => handleCategoryClick(category.value, category.searchTerm)}
          >
            <div className="text-center flex-1 flex flex-col">
              <div className="text-gray-600 mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                {category.icon && <category.icon className="h-5 w-5 md:h-6 md:w-6" />}
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-900 mb-1 md:mb-2 line-clamp-1">
                {category.name}
              </h3>
              <p className="text-xs text-gray-600 mb-2 line-clamp-2 leading-relaxed flex-1">
                {category.description}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full group-hover:bg-gray-50 text-xs border border-gray-200 hover:border-gray-300 h-7 md:h-8 mt-auto"
              >
                Browse
                <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryOverview;