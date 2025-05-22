
import React from "react";
import Hero from "../Hero";
import GiftCountdown from "./GiftCountdown";

// Sample upcoming event for the homepage hero countdown
const nextOccasion = {
  name: "Father's Day",
  // Use a date in the near future for demonstration. Adjust as needed!
  date: new Date(new Date().getFullYear(), 5, 16), // June 16th (0-based months)
  type: "holiday",
};

const HeroSection: React.FC = () => {
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
