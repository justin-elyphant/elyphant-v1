
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ResponsiveText } from "@/components/ui/responsive-text";
import { Gift, ArrowRight } from "lucide-react";

const SeasonalGiftGuide = () => {
  const navigate = useNavigate();
  
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
  
  const seasonalTitle = `${season} Gift Guide`;
  const holidayTitle = `${holiday} Gift Ideas`;
  
  const handleNavigate = (query: string) => {
    navigate(`/marketplace?search=${encodeURIComponent(query)}`);
  };
  
  return (
    <div className="mb-16">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-0">
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seasonal Gift Guide Card */}
        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="grid grid-cols-1 md:grid-cols-5 h-full">
            <div className="md:col-span-3 relative">
              <div className="h-48 md:h-full bg-gradient-to-r from-purple-100 to-purple-200 flex flex-col justify-center items-center p-6">
                <Gift className="h-12 w-12 text-purple-600 mb-3" />
                <ResponsiveText 
                  as="h3" 
                  className="font-bold text-center text-purple-800"
                  mobileSize="xl"
                  desktopSize="2xl"
                >
                  {seasonalTitle}
                </ResponsiveText>
                <p className="text-purple-700 text-center mt-2">
                  Curated gifts perfect for {season.toLowerCase()} celebrations
                </p>
              </div>
            </div>
            <div className="md:col-span-2 p-6 flex flex-col justify-between">
              <div>
                <h4 className="font-medium text-lg mb-2">Top {season} Categories</h4>
                <ul className="space-y-2 mb-6">
                  <li className="text-gray-700 hover:text-purple-600 cursor-pointer" 
                      onClick={() => handleNavigate(`${season} fashion`)}>
                    {season} Fashion
                  </li>
                  <li className="text-gray-700 hover:text-purple-600 cursor-pointer"
                      onClick={() => handleNavigate(`${season} home decor`)}>
                    Home & Decor
                  </li>
                  <li className="text-gray-700 hover:text-purple-600 cursor-pointer"
                      onClick={() => handleNavigate(`${season} outdoors`)}>
                    Outdoor & Activities
                  </li>
                </ul>
              </div>
              
              <Button 
                onClick={() => handleNavigate(`${season} gifts`)}
                className="w-full"
              >
                Explore {season} Gifts
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Holiday Gift Guide Card */}
        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="grid grid-cols-1 md:grid-cols-5 h-full">
            <div className="md:col-span-3 relative">
              <div className="h-48 md:h-full bg-gradient-to-r from-blue-100 to-teal-100 flex flex-col justify-center items-center p-6">
                <Gift className="h-12 w-12 text-blue-600 mb-3" />
                <ResponsiveText 
                  as="h3" 
                  className="font-bold text-center text-blue-800"
                  mobileSize="xl"
                  desktopSize="2xl"
                >
                  {holidayTitle}
                </ResponsiveText>
                <p className="text-blue-700 text-center mt-2">
                  Perfect gifts to celebrate {holiday}
                </p>
              </div>
            </div>
            <div className="md:col-span-2 p-6 flex flex-col justify-between">
              <div>
                <h4 className="font-medium text-lg mb-2">Popular for {holiday}</h4>
                <ul className="space-y-2 mb-6">
                  <li className="text-gray-700 hover:text-blue-600 cursor-pointer"
                      onClick={() => handleNavigate(`${holiday} bestsellers`)}>
                    Bestsellers
                  </li>
                  <li className="text-gray-700 hover:text-blue-600 cursor-pointer"
                      onClick={() => handleNavigate(`${holiday} special`)}>
                    Special Editions
                  </li>
                  <li className="text-gray-700 hover:text-blue-600 cursor-pointer"
                      onClick={() => handleNavigate(`${holiday} gift sets`)}>
                    Gift Sets
                  </li>
                </ul>
              </div>
              
              <Button 
                onClick={() => handleNavigate(`${holiday} gifts`)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Shop {holiday} Gifts
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SeasonalGiftGuide;
