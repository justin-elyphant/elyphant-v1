export interface HolidayFontConfig {
  displayText: string;
  fontFamily: string;
  tailwindClass: string;
}

export const HOLIDAY_FONTS: Record<string, HolidayFontConfig> = {
  "Halloween": {
    displayText: "for Halloween",
    fontFamily: "Creepster",
    tailwindClass: "font-halloween"
  },
  "Christmas": {
    displayText: "for Christmas",
    fontFamily: "Mountains of Christmas",
    tailwindClass: "font-christmas"
  },
  "Holiday Gifts": {
    displayText: "for the Holidays",
    fontFamily: "Great Vibes",
    tailwindClass: "font-holidays"
  },
  "Hanukkah": {
    displayText: "for Hanukkah",
    fontFamily: "Great Vibes",
    tailwindClass: "font-holidays"
  },
  "Valentine's Day": {
    displayText: "for Valentine's Day",
    fontFamily: "Dancing Script",
    tailwindClass: "font-valentines"
  },
  "Easter": {
    displayText: "for Easter",
    fontFamily: "Satisfy",
    tailwindClass: "font-easter"
  },
  "Mother's Day": {
    displayText: "for Mother's Day",
    fontFamily: "Pacifico",
    tailwindClass: "font-mothers"
  },
  "Father's Day": {
    displayText: "for Father's Day",
    fontFamily: "Playfair Display",
    tailwindClass: "font-fathers"
  },
  "Graduation Season": {
    displayText: "for Graduation",
    fontFamily: "Cinzel",
    tailwindClass: "font-graduation"
  },
  "Back to School": {
    displayText: "for Back to School",
    fontFamily: "Bubblegum Sans",
    tailwindClass: "font-school"
  },
  "Black Friday": {
    displayText: "for Black Friday",
    fontFamily: "Bebas Neue",
    tailwindClass: "font-blackfriday"
  },
  "Cyber Monday": {
    displayText: "for Cyber Monday",
    fontFamily: "Orbitron",
    tailwindClass: "font-cybermonday"
  }
};

export const DEFAULT_HOLIDAY_FONT: HolidayFontConfig = {
  displayText: "for Every Occasion",
  fontFamily: "Great Vibes",
  tailwindClass: "font-holidays"
};
