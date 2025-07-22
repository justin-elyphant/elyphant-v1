
import React from "react";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface QuickPickCategory {
  id: string;
  title: string;
  image: string;
  route: string;
}

const QuickPicksCarousel: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const quickPicks: QuickPickCategory[] = [
    {
      id: "for-her",
      title: "Gifts for Her",
      image: "/lovable-uploads/fc8f1469-dd19-4afb-a58d-8b625c04dab4.png",
      route: "/marketplace?category=women"
    },
    {
      id: "for-him",
      title: "Gifts for Him",
      image: "/lovable-uploads/7d144e75-076d-49c9-9247-80aee169f9de.png",
      route: "/marketplace?category=men"
    },
    {
      id: "tech",
      title: "Tech Gifts",
      image: "/lovable-uploads/fd0d7840-d7ea-4a76-8cd7-2debf6425643.png", 
      route: "/marketplace?category=electronics"
    },
    {
      id: "home",
      title: "Home & Living",
      image: "/lovable-uploads/65682a51-b1be-4631-9f58-8591476a5eae.png",
      route: "/marketplace?category=home"
    },
    {
      id: "jewelry",
      title: "Jewelry",
      image: "/lovable-uploads/43f8a9f8-fa27-411f-837d-460272917b95.png",
      route: "/marketplace?category=jewelry"
    }
  ];

  const handleCategoryClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="py-4">
      <h2 className="text-xl font-semibold mb-4">Quick Picks</h2>
      <Carousel
        opts={{
          align: "start",
          loop: true
        }}
        className="w-full"
      >
        <CarouselContent>
          {quickPicks.map((category) => (
            <CarouselItem 
              key={category.id}
              className={`${isMobile ? 'basis-1/2' : 'basis-1/4'} md:basis-1/5 lg:basis-1/6`}
            >
              <div 
                className="h-full p-1"
                onClick={() => handleCategoryClick(category.route)}
              >
                <div className="rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-lg border border-gray-200 h-full">
                  <div className="aspect-square overflow-hidden">
                    <img 
                      src={category.image} 
                      alt={category.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <div className="p-2 text-center bg-white">
                    <h3 className="text-sm font-medium">{category.title}</h3>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};

export default QuickPicksCarousel;
