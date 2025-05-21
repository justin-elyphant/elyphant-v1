
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gift, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { getUpcomingOccasions } from "@/components/marketplace/utils/upcomingOccasions";
import { useConnectedFriendsSpecialDates } from "@/hooks/useConnectedFriendsSpecialDates";
import useTargetEvent from "@/components/marketplace/hero/useTargetEvent";
import CountdownTimer from "@/components/marketplace/hero/CountdownTimer";
import GlassCard from "./GlassCard";
import { normalizeEventDate } from "./utils/normalizeEventDate";
import DebugInfoPanel from "./DebugInfoPanel";

// Utility to pick an appropriate search term
const getEventSearchTerm = (event: any) => {
  if (!event) return "gift";
  if (event.searchTerm && typeof event.searchTerm === "string") {
    return event.searchTerm;
  }
  return `${event.type} gift`;
};

const HeroSection = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Get upcoming occasions logic
  const { friendOccasions } = useConnectedFriendsSpecialDates();
  const upcomingHolidays = getUpcomingOccasions().filter(occ => occ.type === "holiday");
  const nextHoliday = upcomingHolidays.length > 0 ? upcomingHolidays[0] : null;

  const { targetEvent } = useTargetEvent(
    user,
    nextHoliday,
    upcomingHolidays,
    friendOccasions
  );

  // Pick event to display: Prefer targetEvent then nextHoliday
  let displayEvent = targetEvent || nextHoliday;
  displayEvent = normalizeEventDate(displayEvent);

  // Is the normalized event date actually valid and in the future?
  const validEventDate = (
    displayEvent &&
    displayEvent.date instanceof Date &&
    !isNaN(displayEvent.date.getTime()) &&
    displayEvent.date.getTime() > Date.now()
  );

  // Handler for contextual CTA
  const handleEventCta = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!displayEvent) return;
    const searchTerm = getEventSearchTerm(displayEvent);
    navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div className="relative bg-gradient-to-br from-purple-50 to-indigo-100 overflow-hidden min-h-[580px] flex items-center">
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-grid-pattern"></div>
      </div>
      <div className="container relative z-10 mx-auto px-3 md:px-8 pt-14 pb-10 md:py-20">
        {/* Debug panel now only visible in development, removed for prod */}
        <DebugInfoPanel displayEvent={displayEvent} validEventDate={validEventDate} />
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-10 md:gap-8">
          {/* Left content */}
          <div className="md:w-1/2 flex flex-col justify-center">
            <GlassCard className="w-full md:w-auto mx-auto md:mx-0">
              {/* Event Countdown Block */}
              {displayEvent && validEventDate ? (
                <div className="mb-7 animate-fade-in flex flex-col items-center md:items-start">
                  <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-purple-500 mb-2">
                    {displayEvent.name}
                  </span>
                  <CountdownTimer
                    targetDate={displayEvent.date}
                    eventName={displayEvent.name}
                  />
                  <Button
                    size="lg"
                    className="mt-5 w-full md:w-auto rounded-full bg-purple-600 hover:bg-purple-700 font-semibold shadow-md text-base px-7 py-3"
                    onClick={handleEventCta}
                  >
                    <Gift className="mr-2 h-5 w-5" />
                    Shop {displayEvent.name} Gifts
                  </Button>
                </div>
              ) : (
                <div className="mb-7 text-center animate-fade-in text-gray-500 font-medium">
                  No upcoming events!
                </div>
              )}

              {/* Headline + Text */}
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-4 mt-2 leading-tight"
              >
                Gift-Giving{" "}
                <span className="inline-block text-transparent bg-clip-text bg-gradient-to-br from-purple-600 via-purple-400 to-indigo-500">
                  Simplified
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 max-w-lg mx-auto md:mx-0 font-medium">
                Create wishlists, find perfect gifts, and never miss an important occasion.
                Our AI-powered platform makes thoughtful gifting effortless.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start w-full md:w-auto">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg px-8 py-3 w-full sm:w-auto"
                >
                  <Link to={user ? "/dashboard" : "/signup"}>
                    <Gift className="mr-2 h-5 w-5" />
                    {user ? "Go to Dashboard" : "Start Gifting"}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full w-full sm:w-auto border-purple-300 text-purple-700 font-semibold px-8 py-3"
                >
                  <Link to="/wishlists">
                    Create Wishlist
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </GlassCard>
          </div>
          {/* Right Side - Hero Image */}
          <div className="md:w-1/2 flex justify-center md:justify-end relative mt-8 md:mt-0">
            <div className="relative z-10">
              <img
                src="/lovable-uploads/40945f7c-45d5-47dd-8e0c-00ce6f201816.png"
                alt="Gift giving made easy"
                className="rounded-3xl shadow-2xl max-w-full h-auto w-[92vw] md:w-[430px] lg:w-[520px] object-cover"
                style={{ aspectRatio: "5/4" }}
              />
              <div className="absolute -bottom-5 right-0 md:-right-5 bg-white/90 rounded-xl p-4 shadow-lg min-w-[205px] max-w-xs">
                <p className="font-bold text-purple-600 text-base mb-1">Thoughtful gifts, every time</p>
                <p className="text-xs text-gray-600 font-medium">Powered by smart recommendations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
