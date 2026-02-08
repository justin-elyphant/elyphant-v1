import React from "react";

const MarketplaceLandingHero: React.FC = () => {
  return (
    <section className="py-10 md:py-16 text-center">
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-3">
        Find the Perfect Gift
      </h1>
      <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
        Discover curated gifts for every person and occasion
      </p>
    </section>
  );
};

export default MarketplaceLandingHero;
