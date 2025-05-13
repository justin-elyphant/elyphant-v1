import { addDays, isAfter, isBefore, setYear } from "date-fns";

export interface GiftOccasion {
  name: string;
  searchTerm: string;
  date: Date;
  type: "holiday" | "birthday" | "anniversary" | "custom";
  personId?: string;
  personName?: string;
  personImage?: string;
}

export const getUpcomingOccasions = (): GiftOccasion[] => {
  const currentYear = new Date().getFullYear();
  const today = new Date();
  
  // Define all gift-giving occasions with their dates
  const occasions: GiftOccasion[] = [
    // 2025 Occasions
    { 
      name: "Mother's Day",
      searchTerm: "mothers day gifts",
      date: new Date(2025, 4, 11), // May 11, 2025 - already passed on May 13
      type: "holiday"
    },
    { 
      name: "Valentine's Day",
      searchTerm: "valentines day gifts",
      date: new Date(2026, 1, 14), // February 14, 2026 (for next year)
      type: "holiday"
    },
    {
      name: "Father's Day",
      searchTerm: "fathers day gifts",
      date: new Date(2025, 5, 15), // June 15, 2025
      type: "holiday"
    },
    {
      name: "Graduation Season",
      searchTerm: "graduation gifts",
      date: new Date(2025, 4, 31), // May 31, 2025 - moved to end of May
      type: "holiday"
    },
    { 
      name: "Easter",
      searchTerm: "easter gifts",
      date: new Date(2026, 3, 5), // April 5, 2026 (for next year)
      type: "holiday"
    },
    {
      name: "Back to School",
      searchTerm: "school gifts",
      date: new Date(2025, 7, 15), // August 15, 2025
      type: "holiday"
    },
    {
      name: "Labor Day",
      searchTerm: "labor day deals",
      date: new Date(2025, 8, 1), // September 1, 2025
      type: "holiday"
    },
    {
      name: "Halloween",
      searchTerm: "halloween gifts",
      date: new Date(2025, 9, 31), // October 31, 2025
      type: "holiday"
    },
    {
      name: "Thanksgiving",
      searchTerm: "thanksgiving gifts",
      date: new Date(2025, 10, 27), // November 27, 2025
      type: "holiday"
    },
    {
      name: "Black Friday",
      searchTerm: "black friday deals",
      date: new Date(2025, 10, 28), // November 28, 2025
      type: "holiday"
    },
    {
      name: "Small Business Saturday",
      searchTerm: "small business gifts",
      date: new Date(2025, 10, 29), // November 29, 2025
      type: "holiday"
    },
    {
      name: "Cyber Monday",
      searchTerm: "cyber monday deals",
      date: new Date(2025, 11, 1), // December 1, 2025
      type: "holiday"
    },
    {
      name: "Green Monday",
      searchTerm: "holiday deals",
      date: new Date(2025, 11, 8), // December 8, 2025
      type: "holiday"
    },
    {
      name: "Hanukkah Begins",
      searchTerm: "hanukkah gifts",
      date: new Date(2025, 11, 21), // December 21, 2025
      type: "holiday"
    },
    {
      name: "Christmas",
      searchTerm: "christmas gifts",
      date: new Date(2025, 11, 25), // December 25, 2025
      type: "holiday"
    },
    
    // 2026 Occasions (keeping these for reference)
    { 
      name: "Valentine's Day",
      searchTerm: "valentines day gifts",
      date: new Date(2026, 1, 14), // February 14, 2026
      type: "holiday"
    },
    { 
      name: "Easter",
      searchTerm: "easter gifts",
      date: new Date(2026, 3, 5), // April 5, 2026
      type: "holiday"
    },
    { 
      name: "Mother's Day",
      searchTerm: "mothers day gifts",
      date: new Date(2026, 4, 10), // May 10, 2026
      type: "holiday"
    },
    {
      name: "Father's Day",
      searchTerm: "fathers day gifts",
      date: new Date(2026, 5, 21), // June 21, 2026
      type: "holiday"
    },
    {
      name: "Labor Day",
      searchTerm: "labor day deals",
      date: new Date(2026, 8, 7), // September 7, 2026
      type: "holiday"
    },
    {
      name: "Halloween",
      searchTerm: "halloween gifts",
      date: new Date(2026, 9, 31), // October 31, 2026
      type: "holiday"
    },
    {
      name: "Thanksgiving",
      searchTerm: "thanksgiving gifts",
      date: new Date(2026, 10, 26), // November 26, 2026
      type: "holiday"
    }
  ];

  // Filter and sort upcoming occasions
  return occasions
    .filter(occasion => {
      // Show occasions within the next 90 days
      return isAfter(occasion.date, today) && isBefore(occasion.date, addDays(today, 90));
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

// Helper function to get the next upcoming holiday
export const getNextHoliday = (): GiftOccasion | null => {
  const occasions = getUpcomingOccasions();
  return occasions.find(occasion => occasion.type === "holiday") || null;
};

// Helper to merge holiday and personal occasions
export const mergeOccasions = (
  holidayOccasions: GiftOccasion[],
  friendOccasions: GiftOccasion[]
): GiftOccasion[] => {
  return [...holidayOccasions, ...friendOccasions]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5); // Only take the 5 closest events
};
