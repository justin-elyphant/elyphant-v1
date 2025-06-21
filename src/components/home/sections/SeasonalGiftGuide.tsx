import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ResponsiveText } from "@/components/ui/responsive-text";
import { Gift, ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const SeasonalGiftGuide = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Determine current season and holiday
  const getCurrentSeason = () => {
    const now = new Date();
    const month = now.getMonth();
    
    if (month >= 0 && month < 3) return "Winter";
    if (month >= 3 && month < 6) return "Spring";
    if (month >= 6 && month < 9) return "Summer";
    return "Fall";
  };
  
  const getUpcomingHoliday = () => {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();
    
    // Simple holiday determination logic
    if (month === 11) return "Christmas";
    if (month === 10) return "Thanksgiving";
    if (month === 9) return "Halloween";
    if (month === 1 && day <= 14) return "Valentine's Day";
    if (month === 4 && day <= 14) return "Mother's Day";
    if (month === 5 && day <= 21) return "Father's Day";
    
    return "Holiday";
  };
  
  const season = getCurrentSeason();
  const holiday = getUpcomingHoliday();
  
  const handleNavigate = (query: string) => {
    navigate(`/marketplace?search=${encodeURIComponent(query)}`);
  };
  
  // Create seasonal guides array for carousel
  const seasonalGuides = [
    {
      id: 1,
      title: `${season} Gift Guide`,
      description: `Curated gifts perfect for ${season.toLowerCase()} celebrations`,
      gradient: "from-purple-100 to-purple-200",
      iconColor: "text-purple-600",
      textColor: "text-purple-800",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
      categories: [
        { name: `${season} Fashion`, query: `${season} fashion` },
        { name: "Home & Decor", query: `${season} home decor` },
        { name: "Outdoor & Activities", query: `${season} outdoors` }
      ],
      mainQuery: `${season} gifts`
    },
    {
      id: 2,
      title: `${holiday} Gift Ideas`,
      description: `Perfect gifts to celebrate ${holiday}`,
      gradient: "from-blue-100 to-teal-100",
      iconColor: "text-blue-600",
      textColor: "text-blue-800",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      categories: [
        { name: "Bestsellers", query: `${holiday} bestsellers` },
        { name: "Special Editions", query: `${holiday} special` },
        { name: "Gift Sets", query: `${holiday} gift sets` }
      ],
      mainQuery: `${holiday} gifts`
    },
    {
      id: 3,
      title: "Year-Round Favorites",
      description: "Timeless gifts that are perfect for any occasion",
      gradient: "from-green-100 to-emerald-100",
      iconColor: "text-green-600",
      textColor: "text-green-800",
      buttonColor: "bg-green-600 hover:bg-green-700",
      categories: [
        { name: "Classic Gifts", query: "classic gifts" },
        { name: "Trending Now", query: "trending gifts" },
        { name: "Best Sellers", query: "best selling gifts" }
      ],
      mainQuery: "popular gifts"
    }
  ];
  
  return (
    <div className="mb-16 overflow-hidden">
      {/* Full bleed container */}
      <div className={isMobile ? "" : "ml-4 md:ml-6"}>
        <div className={`flex flex-col md:flex-row justify-between items-center mb-6 ${isMobile ? "px-4" : ""}`}>
          <h2 className="text-3xl md:text-4xl font-bold mb-2 md:mb-0">
            Seasonal Gift Guides
          </h2>
          <Button 
            variant="link" 
            className="text-purple-600 hover:text-purple-800 flex items-center"
            onClick={() => navigate('/marketplace?category=seasonal')}
          >
            View all gift guides <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        
        <Carousel
          opts={{
            align: "start",
            loop: false,
            skipSnaps: false,
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className={isMobile ? "-ml-2" : "-ml-2 md:-ml-4"}>
            {seasonalGuides.map((guide) => (
              <CarouselItem key={guide.id} className={`${isMobile ? "pl-2 basis-4/5" : "pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3"}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  <div className="grid grid-cols-1 md:grid-cols-5 h-full min-h-[280px]">
                    <div className="md:col-span-3 relative">
                      <div className={`h-48 md:h-full bg-gradient-to-r ${guide.gradient} flex flex-col justify-center items-center p-6`}>
                        <Gift className={`h-12 w-12 ${guide.iconColor} mb-3`} />
                        <ResponsiveText 
                          as="h3" 
                          className={`font-bold text-center ${guide.textColor}`}
                          mobileSize="xl"
                          desktopSize="2xl"
                        >
                          {guide.title}
                        </ResponsiveText>
                        <p className={`${guide.textColor.replace('800', '700')} text-center mt-2 text-sm md:text-base`}>
                          {guide.description}
                        </p>
                      </div>
                    </div>
                    <div className="md:col-span-2 p-4 md:p-6 flex flex-col justify-between">
                      <div>
                        <h4 className="font-medium text-lg mb-2">Top Categories</h4>
                        <ul className="space-y-2 mb-4 md:mb-6">
                          {guide.categories.map((category, index) => (
                            <li 
                              key={index}
                              className="text-gray-700 hover:text-purple-600 cursor-pointer transition-colors text-sm md:text-base" 
                              onClick={() => handleNavigate(category.query)}
                            >
                              {category.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <Button 
                        onClick={() => handleNavigate(guide.mainQuery)}
                        className={`w-full ${guide.buttonColor} text-sm md:text-base`}
                        size={isMobile ? "sm" : "default"}
                      >
                        Explore {guide.title.split(' ')[0]} Gifts
                      </Button>
                    </div>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden lg:flex -left-6 disabled:opacity-0 disabled:pointer-events-none transition-opacity" />
          <CarouselNext className="hidden lg:flex -right-6 disabled:opacity-0 disabled:pointer-events-none transition-opacity" />
        </Carousel>
      </div>
    </div>
  );
};

export default SeasonalGiftGuide;
