import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar, Heart, Cake, GraduationCap, Baby, ArrowRight } from "lucide-react";
import { FullWidthSection } from "@/components/layout/FullWidthSection";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import { useToast } from "@/hooks/use-toast";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const occasions = [
  {
    id: 'valentines-day',
    name: "Valentine's Day",
    icon: Heart,
    searchTerm: "best selling valentines day gifts",
    color: "bg-red-500",
    description: "Show your love with romantic gifts"
  },
  {
    id: 'birthdays',
    name: "Birthdays",
    icon: Cake,
    searchTerm: "best selling birthday gifts",
    color: "bg-pink-500",
    description: "Make their special day unforgettable"
  },
  {
    id: 'graduation',
    name: "Graduation",
    icon: GraduationCap,
    searchTerm: "best selling graduation gifts",
    color: "bg-blue-500",
    description: "Celebrate their achievements"
  },
  {
    id: 'baby-shower',
    name: "Baby Shower",
    icon: Baby,
    searchTerm: "best selling baby shower gifts",
    color: "bg-green-500",
    description: "Welcome the new arrival"
  },
  {
    id: 'anniversaries',
    name: "Anniversaries",
    icon: Calendar,
    searchTerm: "best selling anniversary gifts",
    color: "bg-purple-500",
    description: "Commemorate your journey together"
  },
  {
    id: 'mothers-day',
    name: "Mother's Day",
    icon: Heart,
    searchTerm: "best selling mothers day gifts",
    color: "bg-rose-500",
    description: "Honor the special mom in your life"
  },
  {
    id: 'fathers-day',
    name: "Father's Day",
    icon: Calendar,
    searchTerm: "best selling fathers day gifts",
    color: "bg-indigo-500",
    description: "Celebrate dad with thoughtful gifts"
  },
  {
    id: 'christmas',
    name: "Christmas",
    icon: Calendar,
    searchTerm: "best selling christmas gifts",
    color: "bg-emerald-500",
    description: "Spread holiday joy and cheer"
  }
];

const FeaturedOccasions: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleOccasionClick = (occasion: { id: string; searchTerm: string; name: string }) => {
    // Navigate with category parameter - ProductCatalogService handles all categories
    console.log(`[FeaturedOccasions] Navigating to occasion: ${occasion.id}`);
    navigate(`/marketplace?category=${occasion.id}`, { 
      state: { fromOccasion: true, occasionType: occasion.id }
    });
  };

  return (
    <FullWidthSection className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
      <ResponsiveContainer>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Occasion
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find the perfect gift for every special moment and celebration
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
              {occasions.map((occasion) => {
                const IconComponent = occasion.icon;
                return (
                  <CarouselItem key={occasion.id} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/4 xl:basis-1/5">
                    <div
                      className="group relative p-4 md:p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 h-full"
                      onClick={() => handleOccasionClick(occasion)}
                    >
                      <div className={`${occasion.color} w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="h-5 w-5 md:h-6 md:w-6 text-white" />
                      </div>
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                        {occasion.name}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 line-clamp-2">
                        {occasion.description}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full group-hover:bg-gray-50 text-xs md:text-sm"
                      >
                        Shop Now
                        <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </Button>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        </div>
      </ResponsiveContainer>
    </FullWidthSection>
  );
};

export default FeaturedOccasions;
