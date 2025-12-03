import { HOLIDAY_FONTS, DEFAULT_HOLIDAY_FONT } from "@/constants/holidayFonts";
import { GiftOccasion } from "@/components/marketplace/utils/upcomingOccasions";

interface HolidayHeroTextProps {
  nextHoliday: GiftOccasion | null;
}

export const HolidayHeroText = ({ nextHoliday }: HolidayHeroTextProps) => {
  const holidayConfig = nextHoliday 
    ? HOLIDAY_FONTS[nextHoliday.name] || DEFAULT_HOLIDAY_FONT
    : DEFAULT_HOLIDAY_FONT;

  return (
    <h1 className="text-heading-1 md:text-4xl lg:text-5xl text-white mb-6 leading-tight text-shadow-lg no-select">
      Connecting Through Gifting
      <span 
        className={`block mt-2 text-2xl md:text-3xl lg:text-4xl ${holidayConfig.tailwindClass}`}
      >
        {holidayConfig.displayText}
      </span>
    </h1>
  );
};
