
import React from "react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Smartphone, Home, Shirt, Dumbbell, Gamepad2, Heart, Baby, Coffee, Book, Music } from "lucide-react";

const categories = [
  { name: "Tech", icon: Smartphone, param: "electronics" },
  { name: "Home", icon: Home, param: "home" },
  { name: "Fashion", icon: Shirt, param: "fashion" },
  { name: "Sports", icon: Dumbbell, param: "sports" },
  { name: "Gaming", icon: Gamepad2, param: "gaming" },
  { name: "Beauty", icon: Heart, param: "beauty" },
  { name: "Baby", icon: Baby, param: "baby" },
  { name: "Kitchen", icon: Coffee, param: "kitchen" },
  { name: "Books", icon: Book, param: "books" },
  { name: "Music", icon: Music, param: "music" },
];

interface CategoryCarouselProps {
  className?: string;
}

const CategoryCarousel: React.FC<CategoryCarouselProps> = ({ className = "" }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const selectedCategory = searchParams.get("category");

  const handleCategoryClick = (categoryParam: string) => {
    const newParams = new URLSearchParams(searchParams);
    
    // If clicking the same category, remove it (toggle off)
    if (selectedCategory === categoryParam) {
      newParams.delete("category");
    } else {
      newParams.set("category", categoryParam);
      // Clear search when selecting a category
      newParams.delete("search");
    }
    
    setSearchParams(newParams, { replace: true });
  };

  if (isMobile) {
    return (
      <div className={`w-full ${className}`}>
        <Carousel
          opts={{
            align: "start",
            slidesToScroll: 1,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {categories.map((category) => (
              <CarouselItem key={category.param} className="pl-2 basis-auto">
                <Button
                  variant={selectedCategory === category.param ? "default" : "outline"}
                  size="sm"
                  className="whitespace-nowrap h-10 px-4 flex items-center gap-2"
                  onClick={() => handleCategoryClick(category.param)}
                >
                  <category.icon className="h-4 w-4" />
                  {category.name}
                </Button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    );
  }

  // Desktop: Show as a grid/wrap layout
  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => (
          <Button
            key={category.param}
            variant={selectedCategory === category.param ? "default" : "outline"}
            size="sm"
            className="h-10 px-4 flex items-center gap-2"
            onClick={() => handleCategoryClick(category.param)}
          >
            <category.icon className="h-4 w-4" />
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CategoryCarousel;
