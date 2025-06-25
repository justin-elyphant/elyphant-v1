
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Box } from "lucide-react";
import { UNIVERSAL_CATEGORIES } from "@/constants/categories";

interface CategoryLinksProps {
  categories: string[];
}

const CategoryLinks: React.FC<CategoryLinksProps> = ({ categories }) => {
  const navigate = useNavigate();

  const handleCategoryClick = (category: string) => {
    // Find the category data from our universal categories
    const categoryData = UNIVERSAL_CATEGORIES.find(cat => 
      cat.name.toLowerCase() === category.toLowerCase() ||
      cat.displayName?.toLowerCase() === category.toLowerCase()
    );
    
    const searchTerm = categoryData?.searchTerm;
    if (searchTerm) {
      // Navigate to marketplace with the search term
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}&category=${encodeURIComponent(categoryData.value)}`);
    } else {
      // Fallback to category-only navigation
      navigate(`/marketplace?category=${encodeURIComponent(category.toLowerCase())}`);
    }
  };

  const handleViewAllGifts = () => {
    navigate('/marketplace');
  };

  // Helper to render categories and add bubble "View All Gifts" after "Toys"
  return (
    <div className="flex flex-wrap gap-3 items-center justify-center">
      {categories.map((category, i) => (
        <React.Fragment key={category}>
          <Button
            variant="ghost"
            className="rounded-full px-5 py-2 bg-white/80 text-purple-800 hover:bg-purple-50 shadow-sm transition"
            onClick={() => handleCategoryClick(category)}
          >
            {category}
          </Button>
          {/* Insert "View All Gifts" bubble right after "Toys" */}
          {category === "Toys" && (
            <Button
              variant="secondary"
              className="rounded-full px-5 py-2 ml-2 bg-purple-600 text-white shadow-lg hover:bg-purple-700 transition font-bold border-0"
              onClick={handleViewAllGifts}
            >
              <Box className="mr-2 h-4 w-4" />
              View All Gifts
            </Button>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default CategoryLinks;
