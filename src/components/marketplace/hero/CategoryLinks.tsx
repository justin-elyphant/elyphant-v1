import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Box } from "lucide-react";

interface CategoryLinksProps {
  categories: string[];
}

const CategoryLinks: React.FC<CategoryLinksProps> = ({ categories }) => {
  // Helper to render categories and add bubble "View All Gifts" after "Toys"
  return (
    <div className="flex flex-wrap gap-3 items-center justify-center">
      {categories.map((category, i) => (
        <React.Fragment key={category}>
          <Button
            variant="ghost"
            className="rounded-full px-5 py-2 bg-white/80 text-purple-800 hover:bg-purple-50 shadow-sm transition"
          >
            {category}
          </Button>
          {/* Insert "View All Gifts" bubble right after "Toys" */}
          {category === "Toys" && (
            <Button
              variant="secondary"
              className="rounded-full px-5 py-2 ml-2 bg-purple-600 text-white shadow-lg hover:bg-purple-700 transition font-bold border-0"
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
