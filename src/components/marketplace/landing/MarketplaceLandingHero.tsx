import React from "react";
import { useNavigate } from "react-router-dom";
import { getQuickAccessCategories } from "@/constants/categories";
import { triggerHapticFeedback } from "@/utils/haptics";
import { motion } from "framer-motion";

const MarketplaceLandingHero: React.FC = () => {
  const navigate = useNavigate();
  const categories = getQuickAccessCategories();

  const handleCategoryClick = (category: { value: string; searchTerm: string }) => {
    triggerHapticFeedback('light');
    navigate(`/marketplace?search=${encodeURIComponent(category.searchTerm)}&category=${category.value}`);
  };

  return (
    <section className="py-10 md:py-16 text-center">
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-3">
        Find the Perfect Gift
      </h1>
      <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
        Discover curated gifts for every person and occasion
      </p>

      {/* Quick-access category pills */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <motion.button
              key={cat.value}
              onClick={() => handleCategoryClick(cat)}
              className="flex items-center gap-2 px-4 py-2.5 min-h-[48px] rounded-full border border-border bg-background text-sm md:text-base font-medium text-foreground shadow-sm touch-manipulation transition-colors hover:bg-muted"
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
              {cat.name}
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};

export default MarketplaceLandingHero;
