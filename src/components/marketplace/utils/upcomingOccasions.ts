
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
  
  // Define all gift-giving occasions with their dates - VERIFIED DATES FOR 2025-2026
  // Set times to 23:59:59 so holidays remain visible throughout the entire day
  const occasions: GiftOccasion[] = [
    // 2025 Occasions
    { 
      name: "Mother's Day",
      searchTerm: "mothers day gifts",
      date: new Date(2025, 4, 11, 23, 59, 59, 999), // May 11, 2025 - Second Sunday in May
      type: "holiday"
    },
    {
      name: "Father's Day",
      searchTerm: "fathers day gifts",
      date: new Date(2025, 5, 15, 23, 59, 59, 999), // June 15, 2025 - Third Sunday in June
      type: "holiday"
    },
    {
      name: "Graduation Season",
      searchTerm: "graduation gifts",
      date: new Date(2025, 4, 15, 23, 59, 59, 999), // May 15, 2025 - Earlier start of graduation season
      type: "holiday"
    },
    { 
      name: "Valentine's Day",
      searchTerm: "valentines day gifts",
      date: new Date(2026, 1, 14, 23, 59, 59, 999), // February 14, 2026 (next year)
      type: "holiday"
    },
    { 
      name: "Easter",
      searchTerm: "easter gifts",
      date: new Date(2026, 3, 5, 23, 59, 59, 999), // April 5, 2026 (next year)
      type: "holiday"
    },
    {
      name: "Back to School",
      searchTerm: "school gifts",
      date: new Date(2025, 7, 15, 23, 59, 59, 999), // August 15, 2025
      type: "holiday"
    },
    {
      name: "Labor Day",
      searchTerm: "labor day deals",
      date: new Date(2025, 8, 1, 23, 59, 59, 999), // September 1, 2025
      type: "holiday"
    },
    {
      name: "Halloween",
      searchTerm: "halloween gifts",
      date: new Date(2025, 9, 31, 23, 59, 59, 999), // October 31, 2025
      type: "holiday"
    },
    {
      name: "Thanksgiving",
      searchTerm: "thanksgiving gifts",
      date: new Date(2025, 10, 27, 23, 59, 59, 999), // November 27, 2025 - Fourth Thursday in November
      type: "holiday"
    },
    {
      name: "Black Friday",
      searchTerm: "black friday deals",
      date: new Date(2025, 10, 28, 23, 59, 59, 999), // November 28, 2025 - Day after Thanksgiving
      type: "holiday"
    },
    {
      name: "Small Business Saturday",
      searchTerm: "small business gifts",
      date: new Date(2025, 10, 29, 23, 59, 59, 999), // November 29, 2025
      type: "holiday"
    },
    {
      name: "Cyber Monday",
      searchTerm: "cyber monday deals",
      date: new Date(2025, 11, 1, 23, 59, 59, 999), // December 1, 2025
      type: "holiday"
    },
    {
      name: "Green Monday",
      searchTerm: "holiday deals",
      date: new Date(2025, 11, 8, 23, 59, 59, 999), // December 8, 2025
      type: "holiday"
    },
    {
      name: "Hanukkah Begins",
      searchTerm: "hanukkah gifts",
      date: new Date(2025, 11, 21, 23, 59, 59, 999), // December 21, 2025
      type: "holiday"
    },
    {
      name: "Christmas",
      searchTerm: "christmas gifts",
      date: new Date(2025, 11, 25, 23, 59, 59, 999), // December 25, 2025
      type: "holiday"
    },
    
    // 2026 Occasions
    { 
      name: "Valentine's Day",
      searchTerm: "valentines day gifts",
      date: new Date(2026, 1, 14, 23, 59, 59, 999), // February 14, 2026
      type: "holiday"
    },
    { 
      name: "Easter",
      searchTerm: "easter gifts",
      date: new Date(2026, 3, 5, 23, 59, 59, 999), // April 5, 2026
      type: "holiday"
    },
    { 
      name: "Mother's Day",
      searchTerm: "mothers day gifts",
      date: new Date(2026, 4, 10, 23, 59, 59, 999), // May 10, 2026 - Second Sunday in May
      type: "holiday"
    },
    {
      name: "Father's Day",
      searchTerm: "fathers day gifts",
      date: new Date(2026, 5, 21, 23, 59, 59, 999), // June 21, 2026 - Third Sunday in June
      type: "holiday"
    },
    {
      name: "Labor Day",
      searchTerm: "labor day deals",
      date: new Date(2026, 8, 7, 23, 59, 59, 999), // September 7, 2026 - First Monday in September
      type: "holiday"
    },
    {
      name: "Halloween",
      searchTerm: "halloween gifts",
      date: new Date(2026, 9, 31, 23, 59, 59, 999), // October 31, 2026
      type: "holiday"
    },
    {
      name: "Thanksgiving",
      searchTerm: "thanksgiving gifts",
      date: new Date(2026, 10, 26, 23, 59, 59, 999), // November 26, 2026 - Fourth Thursday in November
      type: "holiday"
    }
  ];

  // Filter and sort upcoming occasions within the next 90 days
  // Add validation to ensure only future events are included
  return occasions
    .filter(occasion => {
      const eventDate = new Date(occasion.date);
      const now = new Date();
      // Only include events that are today or in the future
      return eventDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) && 
             isBefore(eventDate, addDays(today, 90));
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
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return [...holidayOccasions, ...friendOccasions]
    .filter(occasion => new Date(occasion.date) >= today) // Filter out past events
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5); // Only take the 5 closest events
};
