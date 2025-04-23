
import { addDays, isAfter, isBefore, setYear } from "date-fns";

export interface GiftOccasion {
  name: string;
  searchTerm: string;
  date: Date;
}

export const getUpcomingOccasions = (): GiftOccasion[] => {
  const currentYear = new Date().getFullYear();
  const today = new Date();
  
  // Define all gift-giving occasions with their dates
  const occasions = [
    { 
      name: "Mother's Day",
      searchTerm: "mothers day gifts",
      date: setYear(new Date(currentYear, 4, 12), currentYear) // May 12th
    },
    {
      name: "Father's Day",
      searchTerm: "fathers day gifts",
      date: setYear(new Date(currentYear, 5, 16), currentYear) // June 16th
    },
    {
      name: "Valentine's Day",
      searchTerm: "valentines day gifts",
      date: setYear(new Date(currentYear, 1, 14), currentYear) // February 14th
    },
    {
      name: "Christmas",
      searchTerm: "christmas gifts",
      date: setYear(new Date(currentYear, 11, 25), currentYear) // December 25th
    },
    {
      name: "Halloween",
      searchTerm: "halloween gifts",
      date: setYear(new Date(currentYear, 9, 31), currentYear) // October 31st
    }
  ];

  // Filter and sort upcoming occasions
  return occasions
    .map(occasion => {
      let occasionDate = occasion.date;
      // If the date has passed this year, set it to next year
      if (isBefore(occasionDate, today)) {
        occasionDate = setYear(occasionDate, currentYear + 1);
      }
      return { ...occasion, date: occasionDate };
    })
    .filter(occasion => {
      // Show occasions within the next 90 days
      return isBefore(occasion.date, addDays(today, 90));
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

