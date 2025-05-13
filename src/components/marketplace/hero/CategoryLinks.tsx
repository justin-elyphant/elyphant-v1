
import React from "react";
import { Link } from "react-router-dom";

interface CategoryLinksProps {
  categories: string[];
}

const CategoryLinks: React.FC<CategoryLinksProps> = ({ categories }) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-5">
      {categories.map(category => (
        <Link 
          key={category} 
          to={`/marketplace?category=${category.toLowerCase()}`}
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-medium transition-colors"
        >
          {category}
        </Link>
      ))}
    </div>
  );
};

export default CategoryLinks;
