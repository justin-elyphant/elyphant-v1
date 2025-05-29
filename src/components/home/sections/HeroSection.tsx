
import React from "react";
import Hero from "../Hero";
import GiftCountdown from "./GiftCountdown";
import { getNextHoliday } from "@/components/marketplace/utils/upcomingOccasions";

const HeroSection: React.FC = () => {
  // Get the next upcoming holiday dynamically
  const nextOccasion = getNextHoliday();

  return (
    <section>
      {/* Gift Countdown Banner */}
      <GiftCountdown event={nextOccasion} />
      {/* Hero Component */}
      <Hero />
      {/* Removed FeaturedEvents as its file does not exist */}
    </section>
  );
};

export default HeroSection;
