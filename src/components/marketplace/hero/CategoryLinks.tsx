
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Box } from "lucide-react";

interface CategoryLinksProps {
  categories: string[];
}

const categorySearchTerms: { [key: string]: string } = {
  "Electronics": "best electronics",
  "Fashion": "best fashion", 
  "Home & Garden": "best home products",
  "Sports": "best sports equipment",
  "Beauty": "best beauty products",
  "Books": "best books",
  "Toys": "best toys",
};

const CategoryLinks: React.FC<CategoryLinksProps> = ({ categories }) => {
  const navigate = useNavigate();

  const handleCategoryClick = (category: string) => {
    const searchTerm = categorySearchTerms[category];
    if (searchTerm) {
      // Navigate to marketplace with the search term
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}&category=${encodeURIComponent(category.toLowerCase())}`);
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
