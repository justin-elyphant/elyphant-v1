
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Smartphone, Shirt, Home, Heart, Dumbbell, BookOpen, Gamepad2, Coffee, Palette, Pill, Flower } from "lucide-react";
import { FullWidthSection } from "@/components/layout/FullWidthSection";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const categories = [
  {
    id: 1,
    name: "Electronics",
    icon: Smartphone,
    category: "electronics",
    searchTerm: "best electronics",
    description: "Latest tech and gadgets"
  },
  {
    id: 2,
    name: "Flowers",
    icon: Flower,
    category: "flowers",
    searchTerm: "flowers for delivery",
    description: "Fresh flowers and arrangements"
  },
  {
    id: 3,
    name: "Fashion",
    icon: Shirt,
    category: "fashion",
    searchTerm: "best fashion",
    description: "Clothing and accessories"
  },
  {
    id: 4,
    name: "Home & Living",
    icon: Home,
    category: "home",
    searchTerm: "best home products",
    description: "Decor and household items"
  },
  {
    id: 5,
    name: "Beauty",
    icon: Heart,
    category: "beauty",
    searchTerm: "best beauty products",
    description: "Skincare and cosmetics"
  },
  {
    id: 6,
    name: "Sports",
    icon: Dumbbell,
    category: "sports",
    searchTerm: "best sports equipment",
    description: "Fitness and outdoor gear"
  },
  {
    id: 7,
    name: "Books",
    icon: BookOpen,
    category: "books",
    searchTerm: "best books",
    description: "Literature and educational"
  },
  {
    id: 8,
    name: "Toys & Games",
    icon: Gamepad2,
    category: "toys",
    searchTerm: "best toys",
    description: "Fun for all ages"
  },
  {
    id: 9,
    name: "Food & Drinks",
    icon: Coffee,
    category: "food",
    searchTerm: "best gourmet food",
    description: "Gourmet and specialty items"
  },
  {
    id: 10,
    name: "Arts & Crafts",
    icon: Palette,
    category: "arts",
    searchTerm: "best arts crafts",
    description: "Creative supplies and tools"
  },
  {
    id: 11,
    name: "Health",
    icon: Pill,
    category: "health",
    searchTerm: "best wellness products",
    description: "Wellness and self-care"
  }
];

const FeaturedCategories: React.FC = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (category: string, searchTerm: string) => {
    // Use search terms for better gift-focused results
    if (searchTerm) {
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}&category=${encodeURIComponent(category)}`, { state: { fromHome: true } });
    } else {
      // Fallback to category-based navigation
      navigate(`/marketplace?category=${encodeURIComponent(category)}`, { state: { fromHome: true } });
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
                    onClick={() => handleCategoryClick(category.category, category.searchTerm)}
                  >
                    <div className="text-center">
                      <div className="text-gray-600 mb-2 md:mb-3 lg:mb-4 group-hover:scale-110 transition-transform duration-300 flex justify-center gpu-accelerated">
                        <category.icon className="h-6 w-6 md:h-8 md:w-8 lg:h-10 lg:w-10" />
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
