import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FullBleedSection } from "@/components/layout/FullBleedSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { triggerHapticFeedback } from "@/utils/haptics";
import { motion } from "framer-motion";

const giftCategories = [
  {
    id: "gifts-for-her",
    title: "Gifts for Her",
    description: "Thoughtful gifts she'll love",
    image: "/lovable-uploads/5f6e5bfc-2084-47e5-b28d-5fea068c2b93.png",
    searchTerm: "gifts for her categories",
    navigationUrl: "/marketplace?category=gifts-for-her"
  },
  {
    id: "gifts-for-him",
    title: "Gifts for Him", 
    description: "Perfect gifts for the special man",
    image: "/lovable-uploads/19ec9b7e-120d-40e6-a4f2-2a411add14fb.png",
    searchTerm: "gifts for him categories",
    navigationUrl: "/marketplace?category=gifts-for-him"
  },
  {
    id: "gifts-under-50",
    title: "Gifts under $50",
    description: "Amazing gifts that won't break the bank",
    image: "/lovable-uploads/9c28137d-7145-44ee-a958-177f61bb637a.png",
    searchTerm: "gifts under $50 categories",
    navigationUrl: "/marketplace?category=gifts-under-50"
  },
  {
    id: "luxury-gifts",
    title: "Luxury Gifts",
    description: "Premium gifts for special occasions",
    image: "/lovable-uploads/89069d91-bc3d-4c97-ac4d-70be943ed556.png",
    searchTerm: "luxury categories",
    navigationUrl: "/marketplace?category=luxury"
  }
];

const GiftCategoriesGrid: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleCategoryClick = (category: typeof giftCategories[0]) => {
    triggerHapticFeedback('medium');
    console.log(`[GiftCategoriesGrid] Navigating to: ${category.title} -> ${category.navigationUrl}`);
    navigate(category.navigationUrl, { state: { fromHome: true } });
  };

  const handleButtonClick = (e: React.MouseEvent, category: typeof giftCategories[0]) => {
    e.stopPropagation();
    triggerHapticFeedback('light');
    navigate(category.navigationUrl, { state: { fromHome: true } });
  };

  return (
    <FullBleedSection 
      background="bg-white" 
      height="auto"
      className="py-8 md:py-12"
    >
      {/* Header */}
      <div className="text-center mb-8 md:mb-12 px-4 md:px-6">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
          Quick Picks
        </h2>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          Find the perfect gift for any occasion with our curated collections
        </p>
      </div>

      {/* Category Grid */}
      <div className="px-4 md:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-7xl mx-auto">
          {giftCategories.map((category) => (
            <motion.div
              key={category.id}
              className="group relative overflow-hidden rounded-xl cursor-pointer aspect-[4/5] touch-manipulation"
              onClick={() => handleCategoryClick(category)}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              {/* Image Container */}
              <div className="relative h-full overflow-hidden">
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                  <h3 className="text-base md:text-lg lg:text-xl font-bold text-white mb-1 md:mb-2">
                    {category.title}
                  </h3>
                  <p className="text-xs md:text-sm text-white/90 mb-2 md:mb-3 line-clamp-2">
                    {category.description}
                  </p>
                  <Button
                    variant="secondary"
                    size={isMobile ? "sm" : "default"}
                    className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-200 text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 min-h-[44px] touch-manipulation"
                    onClick={(e) => handleButtonClick(e, category)}
                  >
                    Shop Now
                    <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </FullBleedSection>
  );
};

export default GiftCategoriesGrid;
