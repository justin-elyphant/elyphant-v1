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

const HeroContent: React.FC<HeroContentProps> = ({ targetEvent, isMobile }) => {
  // Helper to format button text
  const getShopNowText = () => {
    if (targetEvent && targetEvent.name) {
      return `Shop ${targetEvent.name} Gift`;
    }
    return "Shop Gifts";
  };

  return (
    <div className={`${isMobile ? 'mb-6 text-center' : 'text-left'}`}>
      {targetEvent ? (
        <>
          <h1 className="text-3xl font-bold mb-3">
            {targetEvent.name} is Coming!
          </h1>
          <p className="text-lg mb-4 opacity-90">
            Find the perfect gifts for {targetEvent.type === "birthday" || targetEvent.type === "anniversary" ? "your loved ones" : "everyone on your list"}. Don't miss out!
          </p>
          <CountdownTimer targetDate={targetEvent.date} eventName={targetEvent.name} />
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-3">Find the Perfect Gift</h1>
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
