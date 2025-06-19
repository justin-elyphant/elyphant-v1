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
import { toast } from "sonner";

const categories = [
  { name: "Tech", icon: Smartphone, param: "electronics", searchTerm: "best selling electronics" },
  { name: "Home", icon: Home, param: "home", searchTerm: "best selling home products" },
  { name: "Fashion", icon: Shirt, param: "fashion", searchTerm: "best selling fashion" },
  { name: "Sports", icon: Dumbbell, param: "sports", searchTerm: "best selling sports equipment" },
  { name: "Gaming", icon: Gamepad2, param: "gaming", searchTerm: "best selling gaming" },
  { name: "Beauty", icon: Heart, param: "beauty", searchTerm: "best selling beauty products" },
  { name: "Baby", icon: Baby, param: "baby", searchTerm: "best selling baby products" },
  { name: "Kitchen", icon: Coffee, param: "kitchen", searchTerm: "best selling kitchen products" },
  { name: "Books", icon: Book, param: "books", searchTerm: "best selling books" },
  { name: "Music", icon: Music, param: "music", searchTerm: "best selling music" },
];

interface CategoryCarouselProps {
  className?: string;
}

const CategoryCarousel: React.FC<CategoryCarouselProps> = ({ className = "" }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const selectedCategory = searchParams.get("category");

  const handleCategoryClick = (categoryParam: string, searchTerm: string) => {
    // Dismiss all existing toasts before starting new search
    toast.dismiss();
    
    const newParams = new URLSearchParams(searchParams);
    
    // If clicking the same category, remove it (toggle off)
    if (selectedCategory === categoryParam) {
      newParams.delete("category");
      newParams.delete("search");
    } else {
      // Use the search term for better results
      if (searchTerm) {
        newParams.set("search", searchTerm);
      }
      newParams.set("category", categoryParam);
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
                  onClick={() => handleCategoryClick(category.param, category.searchTerm)}
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
            onClick={() => handleCategoryClick(category.param, category.searchTerm)}
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
