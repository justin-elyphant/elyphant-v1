
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
    <FullWidthSection className="py-space-loose md:py-space-xl surface-secondary intersection-target">
      <ResponsiveContainer className="container-content">
        <div className="text-center mb-space-loose md:mb-space-xl">
          <h2 className="text-heading-2 md:text-heading-1 text-foreground mb-space-tight md:mb-space-standard">
            Shop by Category
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
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
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Navigation arrows - hidden on mobile, visible on desktop */}
            <CarouselPrevious className="hidden md:flex -left-12 top-1/2 -translate-y-1/2 bg-white shadow-md border border-gray-200 hover:bg-gray-50" />
            <CarouselNext className="hidden md:flex -right-12 top-1/2 -translate-y-1/2 bg-white shadow-md border border-gray-200 hover:bg-gray-50" />
          </Carousel>
          
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
      </ResponsiveContainer>
    </FullWidthSection>
  );
};

export default FeaturedCategories;
