import React from "react";
import Hero from "../Hero";
import FeaturedEvents from "./FeaturedEvents";

const HeroSection: React.FC = () => {
  return (
    <section>
      {/* Hero Component */}
      <Hero />

      {/* Featured Events Section */}
      <FeaturedEvents />
    </section>
  );
};

export default HeroSection;
