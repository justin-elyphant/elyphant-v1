
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Smartphone, Shirt, Home, Heart, Dumbbell, BookOpen, Gamepad2, Coffee, Palette, Pill } from "lucide-react";
import { FullWidthSection } from "@/components/layout/FullWidthSection";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const categories = [
  {
    id: 1,
    name: "Electronics",
    icon: Smartphone,
    category: "electronics",
    description: "Latest tech and gadgets"
  },
  {
    id: 2,
    name: "Fashion",
    icon: Shirt,
    category: "fashion",
    description: "Clothing and accessories"
  },
  {
    id: 3,
    name: "Home & Living",
    icon: Home,
    category: "home",
    description: "Decor and household items"
  },
  {
    id: 4,
    name: "Beauty",
    icon: Heart,
    category: "beauty",
    description: "Skincare and cosmetics"
  },
  {
    id: 5,
    name: "Sports",
    icon: Dumbbell,
    category: "sports",
    description: "Fitness and outdoor gear"
  },
  {
    id: 6,
    name: "Books",
    icon: BookOpen,
    category: "books",
    description: "Literature and educational"
  },
  {
    id: 7,
    name: "Toys & Games",
    icon: Gamepad2,
    category: "toys",
    description: "Fun for all ages"
  },
  {
    id: 8,
    name: "Food & Drinks",
    icon: Coffee,
    category: "food",
    description: "Gourmet and specialty items"
  },
  {
    id: 9,
    name: "Arts & Crafts",
    icon: Palette,
    category: "arts",
    description: "Creative supplies and tools"
  },
  {
    id: 10,
    name: "Health",
    icon: Pill,
    category: "health",
    description: "Wellness and self-care"
  }
];

const FeaturedCategories: React.FC = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (category: string) => {
    // Pass fromHome state to ensure clean filters
    navigate(`/marketplace?category=${encodeURIComponent(category)}`, { state: { fromHome: true } });
  };

  return (
    <FullWidthSection className="py-16 bg-gray-50">
      <ResponsiveContainer>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Browse our wide selection of products organized by category to find exactly what you're looking for
          </p>
        </div>

        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {categories.map((category) => (
                <CarouselItem key={category.id} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                  <div
                    className="group relative p-4 md:p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 h-full"
                    onClick={() => handleCategoryClick(category.category)}
                  >
                    <div className="text-center">
                      <div className="text-gray-600 mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                        <category.icon className="h-8 w-8 md:h-10 md:w-10" />
                      </div>
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                        {category.name}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 line-clamp-2">
                        {category.description}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full group-hover:bg-gray-50 text-xs md:text-sm border border-gray-200 hover:border-gray-300"
                      >
                        Browse
                        <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </Button>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </ResponsiveContainer>
    </FullWidthSection>
  );
};

export default FeaturedCategories;
