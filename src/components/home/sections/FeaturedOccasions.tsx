
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Calendar, Heart, GraduationCap, Baby, PartyPopper, Dog } from "lucide-react";
import { toast } from "sonner";
import { searchProducts } from "@/components/marketplace/zinc/zincService";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Neutral, sophisticated icons (muted purple/dark gray)
const occasions = [
  {
    id: 1,
    name: "Birthdays",
    icon: <PartyPopper className="h-7 w-7 text-[#7E69AB]" />,
    description: "Find the perfect birthday gifts",
    category: "birthday",
    cta: "Gifts for Birthdays",
    searchTerm: "birthday gifts"
  },
  {
    id: 2,
    name: "Weddings",
    icon: <Heart className="h-7 w-7 text-[#7E69AB]" />,
    description: "Celebrate special unions",
    category: "wedding",
    cta: "Wedding Gift Ideas",
    searchTerm: "wedding gifts"
  },
  {
    id: 3,
    name: "Anniversaries",
    icon: <Calendar className="h-7 w-7 text-[#7E69AB]" />,
    description: "Commemorate years together",
    category: "anniversary",
    cta: "Anniversary Gifts",
    searchTerm: "anniversary gifts"
  },
  {
    id: 4,
    name: "Graduations",
    icon: <GraduationCap className="h-7 w-7 text-[#7E69AB]" />,
    description: "Celebrate academic achievements",
    category: "graduation",
    cta: "Graduation Gift Ideas",
    searchTerm: "graduation gifts"
  },
  {
    id: 5,
    name: "Baby Showers",
    icon: <Baby className="h-7 w-7 text-[#7E69AB]" />,
    description: "Welcome new arrivals",
    category: "baby_shower",
    cta: "Baby Shower Gifts",
    searchTerm: "baby shower gifts"
  },
  {
    id: 6,
    name: "Pet Gifts",
    icon: <Dog className="h-7 w-7 text-[#7E69AB]" />,
    description: "Spoil your furry friends",
    category: "pets",
    cta: "Gifts for Pets",
    searchTerm: "pet gifts"
  },
  {
    id: 7,
    name: "All Occasions",
    icon: <Gift className="h-7 w-7 text-[#7E69AB]" />,
    description: "Explore gifts for any event",
    category: "all",
    cta: "Browse All Gift Ideas",
    searchTerm: "popular gifts"
  },
];

const FeaturedOccasions = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loadingOccasion, setLoadingOccasion] = useState<number | null>(null);
  const [fetchStatus, setFetchStatus] = useState<Record<number, string>>({});
  
  useEffect(() => {
    console.log("Fetch status updated:", fetchStatus);
  }, [fetchStatus]);
  
  const handleOccasionClick = async (category: string, occasionName: string, occasionId: number, searchTerm: string) => {
    if (loadingOccasion !== null) return;

    setLoadingOccasion(occasionId);
    setFetchStatus(prev => ({...prev, [occasionId]: "starting"}));
    toast.success(`Exploring ${occasionName.toLowerCase()} gift ideas...`);
    
    try {
      if (searchTerm) {
        setFetchStatus(prev => ({...prev, [occasionId]: "fetching"}));
        const results = await searchProducts(searchTerm, "50");
        setFetchStatus(prev => ({...prev, [occasionId]: `fetched ${results.length} products`}));
        if (results.length === 0) {
          setFetchStatus(prev => ({...prev, [occasionId]: "no products found"}));
        }
      }
    } catch (error) {
      setFetchStatus(prev => ({...prev, [occasionId]: "error fetching"}));
    } finally {
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}`);
      setLoadingOccasion(null);
      setFetchStatus(prev => ({...prev, [occasionId]: "navigation complete"}));
    }
  };

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Featured Occasions
        </h2>
      </div>
      
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {occasions.map((occasion) => (
            <CarouselItem key={occasion.id} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
              <div 
                onClick={() => handleOccasionClick(occasion.category, occasion.name, occasion.id, occasion.searchTerm)}
                className="cursor-pointer h-full"
              >
                <Card className="h-full bg-white border border-gray-200 shadow-subtle rounded-lg 
                  transition-transform transition-shadow duration-200 hover:shadow-lg hover:scale-[1.03]"
                >
                  <CardContent className="p-4 flex flex-col items-center text-center min-h-[140px] justify-center touch-manipulation">
                    <div className="rounded-full bg-gray-50 p-3 mb-2 shadow-sm">
                      <span className="block">
                        {React.cloneElement(occasion.icon, {
                          className: "h-8 w-8 " + (occasion.icon.props.className || '')
                        })}
                      </span>
                    </div>
                    <h3 className="font-sans font-semibold text-base text-gray-900 tracking-tight mb-1">
                      {occasion.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2 text-center leading-relaxed">
                      {occasion.description}
                    </p>
                    <span className="text-sm font-medium text-[#7E69AB] group-hover:underline underline-offset-2 transition-all">
                      {loadingOccasion === occasion.id ? "Loading..." : occasion.cta}
                    </span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:block">
          <CarouselPrevious />
          <CarouselNext />
        </div>
      </Carousel>
    </div>
  );
};

export default FeaturedOccasions;
