
import React from "react";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
import CountdownTimer from "./CountdownTimer";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Event {
  name: string;
  date: Date;
  type: string;
}

interface HeroContentProps {
  targetEvent: Event | null;
  isMobile: boolean;
}

// Helper to capitalize the event type
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const HeroContent: React.FC<HeroContentProps> = ({ targetEvent, isMobile }) => {
  const navigate = useNavigate();

  // Helper to format button text
  const getShopNowText = () => {
    if (targetEvent && targetEvent.name) {
      return `Shop ${targetEvent.name} Gift`;
    }
    return "Shop Gifts";
  };

  // Navigate to the marketplace with a search for the event name
  const handleShopNowClick = () => {
    if (targetEvent && targetEvent.name) {
      // Use encodeURIComponent for safe URL
      navigate(`/marketplace?search=${encodeURIComponent(targetEvent.name + " gift")}`);
    } else {
      navigate("/marketplace");
    }
  };

  return (
    <div className={`${isMobile ? 'mb-6 text-center' : 'text-left'} flex flex-col items-center md:items-start`}>
      {targetEvent ? (
        <>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-3 leading-tight text-shadow-lg">
            <span className="inline-block bg-gradient-to-br from-purple-300 via-purple-200 to-indigo-300 bg-clip-text text-transparent animate-fade-in">
              {targetEvent.name}
            </span>
            <span className="ml-2 text-white">
              {" is coming!"}
            </span>
          </h1>
          <p className="text-lg text-white/90 mb-4 font-medium text-shadow-md">
            {format(targetEvent.date, "EEEE, MMMM d, yyyy")}
          </p>
          <CountdownTimer targetDate={targetEvent.date} eventName={targetEvent.name} />
        </>
      ) : (
        <>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-3 leading-tight text-shadow-lg">
            <span className="inline-block bg-gradient-to-br from-purple-300 via-purple-200 to-indigo-300 bg-clip-text text-transparent animate-fade-in">
              Find the Perfect Gift
            </span>
          </h1>
        </>
      )}
      
      <div className="flex space-x-4 justify-center md:justify-start">
        <Button className="bg-white text-purple-700 hover:bg-gray-100 shadow-lg" onClick={handleShopNowClick}>
          <Gift className="mr-2 h-4 w-4" />
          {getShopNowText()}
        </Button>
      </div>
    </div>
  );
};

export default HeroContent;
