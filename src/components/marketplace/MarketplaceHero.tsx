
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { getNextHoliday, getUpcomingOccasions } from "./utils/upcomingOccasions";
import { useConnectedFriendsSpecialDates } from "@/hooks/useConnectedFriendsSpecialDates";
import { useAuth } from "@/contexts/auth";
import HeroContent from "./hero/HeroContent";
import OccasionTabs from "./hero/OccasionTabs";
import CategoryLinks from "./hero/CategoryLinks";
import useTargetEvent from "./hero/useTargetEvent";

// MarketplaceHero Props
interface MarketplaceHeroProps {
  isCollapsed: boolean;
}

const MarketplaceHero: React.FC<MarketplaceHeroProps> = ({ isCollapsed }) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useAuth();

  const upcomingHolidays = getUpcomingOccasions().filter(occ => occ.type === "holiday");
  const { friendOccasions } = useConnectedFriendsSpecialDates();
  const nextHoliday = upcomingHolidays.length > 0 ? upcomingHolidays[0] : null;
  const { targetEvent } = useTargetEvent(user, nextHoliday, upcomingHolidays, friendOccasions);

  // Handler for card click
  const handleOccasionCardClick = (searchQuery: string, personId?: string, occasionType?: string) => {
    const params = new URLSearchParams();
    params.set("search", searchQuery);
    if (personId) params.set("personId", personId);
    if (occasionType) params.set("occasionType", occasionType);
    navigate(`/marketplace?${params.toString()}`);
  };

  const popularCategories = ['Electronics', 'Fashion', 'Home', 'Books', 'Toys'];

  // ----- RESPONSIVE LAYOUT ------
  // If collapsed, show nothing/minimized
  if (isCollapsed) {
    return (
      <div className="transition-all duration-400 overflow-hidden" style={{ minHeight: isMobile ? 0 : 0, height: 0, padding: 0, marginBottom: 0 }} />
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-100 mb-6 animate-fade-in">
      <div className="container mx-auto px-4 py-8">
        {/* Responsive two-column: left = text/hero, right = tabbed upcoming occasions */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-8`}>
          {/* LEFT: Headline, countdown, etc */}
          <div>
            <HeroContent targetEvent={targetEvent} isMobile={isMobile} />
          </div>
          {/* RIGHT: Tabbed occasions */}
          <div className="max-w-md mx-auto md:mx-0 w-full">
            <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl border px-6 py-7">
              <h2 className="font-sans text-lg md:text-xl font-semibold mb-4 text-gray-900 text-center">
                Upcoming Gift Occasions
              </h2>
              <OccasionTabs
                friendOccasions={friendOccasions}
                upcomingHolidays={upcomingHolidays}
                onCardClick={handleOccasionCardClick}
              />
            </div>
          </div>
        </div>
        {/* Categories under hero */}
        <CategoryLinks categories={popularCategories} />
      </div>
    </div>
  );
};

export default MarketplaceHero;
