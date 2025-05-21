import React from "react";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
import CountdownTimer from "./CountdownTimer";

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
  // Helper to format button text
  const getShopNowText = () => {
    if (targetEvent && targetEvent.name) {
      return `Shop ${targetEvent.name} Gift`;
    }
    return "Shop Gifts";
  };

  return (
    <div className={`${isMobile ? 'mb-6 text-center' : 'text-left'} flex flex-col items-center md:items-start`}>
      {targetEvent ? (
        <>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-3 leading-tight">
            <span className="inline-block bg-gradient-to-br from-purple-600 via-purple-400 to-indigo-500 bg-clip-text text-transparent animate-fade-in">
              {targetEvent.name}
            </span>
            <span className="ml-2 text-black dark:text-white">
              {" is coming!"}
            </span>
          </h1>
          <p className="text-lg mb-4 opacity-90">
            Find the perfect gifts for {targetEvent.type === "birthday" || targetEvent.type === "anniversary" ? "your loved ones" : "everyone on your list"}. Don't miss out!
          </p>
          <CountdownTimer targetDate={targetEvent.date} eventName={targetEvent.name} />
        </>
      ) : (
        <>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-3 leading-tight">
            <span className="inline-block bg-gradient-to-br from-purple-600 via-purple-400 to-indigo-500 bg-clip-text text-transparent animate-fade-in">
              Find the Perfect Gift
            </span>
          </h1>
          <p className="text-lg mb-4 opacity-90">
            Discover thoughtful gifts for every occasion and relationship in your life.
          </p>
        </>
      )}
      
      <div className="flex space-x-4 justify-center md:justify-start">
        <Button className="bg-white text-purple-700 hover:bg-gray-100">
          <Gift className="mr-2 h-4 w-4" />
          {getShopNowText()}
        </Button>
      </div>
    </div>
  );
};

export default HeroContent;
