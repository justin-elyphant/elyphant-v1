import React from "react";
import { Heart, Gift, DollarSign, Gem } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MarketplaceHeroBannerProps {
  category?: string;
  hideFromCategoryNavigation?: boolean;
  quickPickCategory?: 'giftsForHer' | 'giftsForHim' | 'giftsUnder50' | 'luxury' | null;
}

const MarketplaceHeroBanner: React.FC<MarketplaceHeroBannerProps> = ({ 
  category, 
  hideFromCategoryNavigation = false,
  quickPickCategory = null
}) => {
  const isMobile = useIsMobile();
  // Hide banner if coming from homepage category navigation
  if (hideFromCategoryNavigation) {
    return null;
  }
  // Use flowers hero image for flowers category, default image for others
  const getHeroImage = () => {
    if (category === "flowers") {
      return "/lovable-uploads/e18984c4-fb6f-467a-9e30-b6daf25924d6.png";
    }
    return "/lovable-uploads/926a4c93-9561-4fa7-a02b-524a331ca92d.png";
  };

  const getHeroText = () => {
    // Quick Pick category headers
    if (quickPickCategory) {
      switch (quickPickCategory) {
        case 'giftsForHer':
          return {
            title: "Gifts for Her",
            subtitle: "Thoughtful gifts she'll love and cherish",
            icon: <Heart className="h-8 w-8 md:h-10 md:w-10 text-white/80 mb-4" />,
            badges: ["💝 Thoughtful Selection", "✨ Premium Quality", "🚚 Fast Delivery"]
          };
        case 'giftsForHim':
          return {
            title: "Gifts for Him",
            subtitle: "Perfect gifts for the special man in your life",
            icon: <Gift className="h-8 w-8 md:h-10 md:w-10 text-white/80 mb-4" />,
            badges: ["🎁 Curated for Men", "⚡ Top Quality", "🚚 Quick Shipping"]
          };
        case 'giftsUnder50':
          return {
            title: "Gifts Under $50",
            subtitle: "Great gifts that won't break the bank",
            icon: <DollarSign className="h-8 w-8 md:h-10 md:w-10 text-white/80 mb-4" />,
            badges: ["💰 Budget Friendly", "🎯 Best Value", "✨ Quality Guaranteed"]
          };
        case 'luxury':
          return {
            title: "Luxury Gifts",
            subtitle: "Premium gifts for special occasions",
            icon: <Gem className="h-8 w-8 md:h-10 md:w-10 text-white/80 mb-4" />,
            badges: ["👑 Premium Quality", "🌟 Luxury Brands", "🎁 Special Occasions"]
          };
      }
    }
    
    // Category-specific headers
    if (category === "flowers") {
      return {
        title: "Fresh Flowers & Arrangements",
        subtitle: "Beautiful blooms for every occasion",
        icon: null,
        badges: ["🌸 Fresh Daily", "💐 Custom Arrangements", "🚚 Same Day Delivery"]
      };
    }
    
    // Default header
    return {
      title: isMobile ? "Elyphant Marketplace" : "Discover Amazing Products",
      subtitle: "Find gifts from trusted brands",
      icon: null,
      badges: ["🚚 Fast Delivery"]
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
        <div className={`absolute inset-0 ${category === "flowers" ? "bg-black/15" : "bg-black/30"}`}></div>
      </div>
      
      {/* Hero Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center text-white px-6 max-w-4xl mx-auto">
          {heroText.icon && (
            <div className="flex justify-center">
              {heroText.icon}
            </div>
          )}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 drop-shadow-lg">
            {heroText.title}
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-6 drop-shadow-md opacity-90 max-w-2xl mx-auto">
            {isMobile ? (heroText.subtitle.length > 40 ? heroText.subtitle.split(' ').slice(0, 6).join(' ') : heroText.subtitle) : heroText.subtitle}
          </p>
          <div className="flex flex-wrap gap-3 justify-center items-center text-sm md:text-base">
            {heroText.badges.slice(0, isMobile ? 2 : 3).map((badge, index) => (
              <span key={index} className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-full border border-white/30 ios-smooth-scroll">
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