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

// Utility to pick an appropriate search term
const getEventSearchTerm = (event) => {
  if (!event) return "gift";
  if (event.searchTerm && typeof event.searchTerm === "string") {
    return event.searchTerm;
  }
  return `${event.type} gift`;
};

// New helper: normalize any date to a native JS Date if possible
function normalizeEventDate(event: any) {
  if (!event || !event.date) return null;

  const raw = event.date;
  let dateObj: Date | null = null;

  // 1. If already a native Date and valid
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    dateObj = raw;
  }
  // 2. If it's an ISO string
  else if (typeof raw === "string" && !isNaN(Date.parse(raw))) {
    dateObj = new Date(raw);
  }
  // 3. If it's an { iso: string } object (not Date)
  else if (
    typeof raw === "object" &&
    raw !== null &&
    "iso" in raw &&
    typeof raw.iso === "string" &&
    !isNaN(Date.parse(raw.iso))
  ) {
    dateObj = new Date(raw.iso);
  }
  // 4. If it's a backend-serialized form: { _type: "Date", value: { iso: ... } }
  else if (
    typeof raw === "object" &&
    raw !== null &&
    raw._type === "Date" &&
    raw.value &&
    typeof raw.value.iso === "string" &&
    !isNaN(Date.parse(raw.value.iso))
  ) {
    dateObj = new Date(raw.value.iso);
  }

  if (dateObj && !isNaN(dateObj.getTime())) {
    return {
      ...event,
      date: dateObj
    };
  }

  // Not parseable, return null
  return null;
}

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

  // Debug logs for diagnosis
  React.useEffect(() => {
    console.info("[HeroSection] targetEvent:", targetEvent);
    console.info("[HeroSection] displayEvent (normalized):", displayEvent);
    if (displayEvent) {
      console.info(
        "[HeroSection] event.date:", displayEvent.date,
        "type:", typeof displayEvent.date,
        "instanceof Date:", displayEvent.date instanceof Date,
        "timestamp:", displayEvent.date instanceof Date ? displayEvent.date.getTime() : 'not-a-date',
        "now:", Date.now(),
        "date string:", displayEvent.date && displayEvent.date.toString()
      );
    }
  }, [targetEvent, displayEvent]);

  // Is the normalized event date actually valid and in the future?
  const validEventDate = (
    displayEvent &&
    displayEvent.date instanceof Date &&
    !isNaN(displayEvent.date.getTime()) &&
    displayEvent.date.getTime() > Date.now()
  );

  // Handler for contextual CTA
  const handleEventCta = (e) => {
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
        {/* --- DEBUG PANEL (Remove after debugging) --- */}
        <div className="mb-6 p-4 rounded-xl border border-dashed border-yellow-400 bg-yellow-100 text-xs text-yellow-900 shadow-inner">
          <div><b>Debug Info</b></div>
          <div><b>displayEvent:</b> {JSON.stringify(displayEvent)}</div>
          <div><b>displayEvent.date:</b> {displayEvent?.date && displayEvent.date.toString ? displayEvent.date.toString() : String(displayEvent?.date)}</div>
          <div><b>validEventDate:</b> {String(validEventDate)}</div>
          <div><b>date.getTime:</b> {displayEvent?.date && displayEvent.date instanceof Date ? displayEvent.date.getTime() : 'n/a'}</div>
          <div><b>now:</b> {Date.now()}</div>
        </div>
        {/* --- END DEBUG PANEL --- */}
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
                  No upcoming events! (debug: {JSON.stringify(displayEvent)})
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
