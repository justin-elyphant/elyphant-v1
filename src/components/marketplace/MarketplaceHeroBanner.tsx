import React from "react";

interface MarketplaceHeroBannerProps {
  category?: string;
}

const MarketplaceHeroBanner: React.FC<MarketplaceHeroBannerProps> = ({ category }) => {
  // Use flowers hero image for flowers category, default image for others
  const getHeroImage = () => {
    if (category === "flowers") {
      return "/lovable-uploads/fa986ca2-612f-47db-af37-46e37b36f6ad.png";
    }
    return "/lovable-uploads/d7528be3-a5aa-4199-8140-3faaaeb083cd.png";
  };

  const getHeroText = () => {
    if (category === "flowers") {
      return {
        title: "Fresh Flowers & Arrangements",
        subtitle: "Beautiful blooms for every occasion",
        badges: ["🌸 Fresh Daily", "💐 Custom Arrangements", "🚚 Same Day Delivery"]
      };
    }
    return {
      title: "Elyphant Marketplace",
      subtitle: "Discover thoughtful gifts for every occasion",
      badges: ["✨ Curated Collections", "🎁 Perfect for Everyone", "🚚 Fast Delivery"]
    };
  };

  const heroText = getHeroText();

  return (
    <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden rounded-lg mb-8">
      {/* Hero Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${getHeroImage()}')`
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>
      
      {/* Hero Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center text-white px-6 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
            {heroText.title}
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-6 drop-shadow-md opacity-90">
            {heroText.subtitle}
          </p>
          <div className="flex flex-wrap gap-4 justify-center items-center text-sm md:text-base">
            {heroText.badges.map((badge, index) => (
              <span key={index} className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceHeroBanner;