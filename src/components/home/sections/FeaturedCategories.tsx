
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FullWidthSection } from "@/components/layout/FullWidthSection";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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
    <FullWidthSection className="py-12 md:py-16 bg-gray-50 intersection-target">
      <ResponsiveContainer className="px-4 md:px-6">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
            Shop by Category
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Browse our wide selection of products organized by category to find exactly what you're looking for
          </p>
        </div>

        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full swipe-container will-change-scroll"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {categories.map((category) => (
                <CarouselItem key={category.id} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 swipe-item">
                  <div
                    className="group relative p-3 md:p-4 lg:p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 h-full touch-target-48 touch-manipulation tap-feedback"
                    onClick={() => handleCategoryClick(category.value, category.searchTerm)}
                  >
                    <div className="text-center">
                      <div className="text-gray-600 mb-2 md:mb-3 lg:mb-4 group-hover:scale-110 transition-transform duration-300 flex justify-center gpu-accelerated">
                        {category.icon && <category.icon className="h-6 w-6 md:h-8 md:w-8 lg:h-10 lg:w-10" />}
                      </div>
                      <h3 className="text-sm md:text-base lg:text-lg font-semibold text-gray-900 mb-2">
                        {category.name}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3 lg:mb-4 line-clamp-2 leading-relaxed">
                        {category.description}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full group-hover:bg-gray-50 text-xs md:text-sm border border-gray-200 hover:border-gray-300 touch-target-44 no-select"
                      >
                        Browse
                        <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </Button>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Navigation arrows - hidden on mobile, visible on desktop */}
            <CarouselPrevious className="hidden md:flex -left-12 top-1/2 -translate-y-1/2 bg-white shadow-md border border-gray-200 hover:bg-gray-50" />
            <CarouselNext className="hidden md:flex -right-12 top-1/2 -translate-y-1/2 bg-white shadow-md border border-gray-200 hover:bg-gray-50" />
          </Carousel>
        </div>
      </ResponsiveContainer>
    </FullWidthSection>
  );
};

export default FeaturedCategories;
