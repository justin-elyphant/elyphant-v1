import React from "react";

const MarketplaceHeroBanner: React.FC = () => {
  return (
    <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden rounded-lg mb-8">
      {/* Hero Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/lovable-uploads/d7528be3-a5aa-4199-8140-3faaaeb083cd.png')`
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>
      
      {/* Hero Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center text-white px-6 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
            Elyphant Marketplace
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-6 drop-shadow-md opacity-90">
            Discover thoughtful gifts for every occasion
          </p>
          <div className="flex flex-wrap gap-4 justify-center items-center text-sm md:text-base">
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              ✨ Curated Collections
            </span>
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              🎁 Perfect for Everyone
            </span>
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              🚚 Fast Delivery
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceHeroBanner;