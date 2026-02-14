import React from "react";
import { useNavigate } from "react-router-dom";
import { UNIVERSAL_CATEGORIES } from "@/constants/categories";
import { triggerHapticFeedback } from "@/utils/haptics";
import { motion } from "framer-motion";

// Curated subset for the browse grid — avoids overwhelming users
const BROWSE_CATEGORIES = UNIVERSAL_CATEGORIES.filter((cat) =>
  [
    "electronics", "fashion", "beauty", "home", "sports", "books",
    "toys", "jewelry", "kitchen", "baby", "pets",
  ].includes(cat.value)
);

const CategoryBrowseGrid: React.FC = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (cat: (typeof UNIVERSAL_CATEGORIES)[number]) => {
    triggerHapticFeedback('light');
    navigate(`/marketplace?search=${encodeURIComponent(cat.searchTerm)}&category=${cat.value}`);
  };

  return (
    <section className="space-y-6 mb-12">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        Browse All Categories
      </h2>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        {BROWSE_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <motion.button
              key={cat.value}
              onClick={() => handleCategoryClick(cat)}
              className="flex flex-col items-center justify-center gap-2 p-4 min-h-[80px] rounded-lg border border-border bg-background shadow-sm touch-manipulation transition-colors hover:bg-muted"
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}
              <span className="text-xs md:text-sm font-medium text-foreground text-center leading-tight">
                {cat.displayName || cat.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryBrowseGrid;
