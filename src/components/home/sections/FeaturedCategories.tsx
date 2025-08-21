
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FullWidthSection } from "@/components/layout/FullWidthSection";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import { getFeaturedCategories } from "@/constants/categories";

const FeaturedCategories: React.FC = () => {
  const navigate = useNavigate();
  const categories = getFeaturedCategories();

  const handleCategoryClick = (category: string, searchTerm: string) => {
    // Enhanced category navigation with brand diversity flag
    if (searchTerm) {
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}&category=${encodeURIComponent(category)}&diversity=true`, 
        { state: { fromHome: true, enableBrandDiversity: true } });
    } else {
      // Fallback to category-based navigation
      navigate(`/marketplace?category=${encodeURIComponent(category)}&diversity=true`, 
        { state: { fromHome: true, enableBrandDiversity: true } });
    }
  };

  return (
    <div className="container-content mb-8 py-space-loose md:py-space-xl">
      <div className="text-center mb-space-loose md:mb-space-xl">
        <h2 className="text-heading-2 md:text-heading-1 text-foreground mb-space-tight md:mb-space-standard">
          Shop by Category
        </h2>
        <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Browse our wide selection of products organized by category to find exactly what you're looking for
        </p>
      </div>

      {/* Grid layout for mobile-first approach */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="group relative card-unified cursor-pointer h-full touch-target-48 touch-manipulation tap-feedback flex flex-col"
            onClick={() => handleCategoryClick(category.value, category.searchTerm)}
          >
            <div className="text-center flex-1 flex flex-col touch-padding">
              <div className="text-muted-foreground mb-space-tight md:mb-space-standard group-hover:scale-110 transition-transform duration-300 flex justify-center gpu-accelerated">
                {category.icon && <category.icon className="h-6 w-6 md:h-8 md:w-8 lg:h-10 lg:w-10" />}
              </div>
              <h3 className="text-body-sm md:text-body lg:text-body-lg font-semibold text-foreground mb-space-minimal">
                {category.name}
              </h3>
              <p className="text-caption md:text-body-sm text-muted-foreground mb-space-tight md:mb-space-standard line-clamp-2 leading-relaxed flex-1">
                {category.description}
              </p>
              <Button
                variant="ghost"
                size="touch"
                className="w-full group-hover:surface-elevated border touch-target-44 no-select mt-auto"
              >
                Browse
                <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Shop All Categories Button */}
      <div className="flex justify-center mt-space-loose md:mt-space-xl">
        <Button
          onClick={() => navigate('/marketplace')}
          variant="outline"
          size="touch"
          className="touch-target-44 transition-all duration-200"
        >
          Shop All Categories
          <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform duration-200" />
        </Button>
      </div>
    </div>
  );
};

export default FeaturedCategories;
