// Holiday date calculations for auto-population
export interface HolidayDate {
  month: number;
  day?: number;
  week?: number;
  weekday?: number;
  type: 'fixed' | 'floating';
}

export const HOLIDAY_DATES: Record<string, HolidayDate> = {
  christmas: { month: 12, day: 25, type: 'fixed' },
  valentine: { month: 2, day: 14, type: 'fixed' },
  mothers_day: { month: 5, week: 2, weekday: 0, type: 'floating' }, // 2nd Sunday in May
  fathers_day: { month: 6, week: 3, weekday: 0, type: 'floating' }, // 3rd Sunday in June
  // Add more holidays as needed
};

export const calculateHolidayDate = (holidayKey: string, year?: number): string | null => {
  const holiday = HOLIDAY_DATES[holidayKey];
  if (!holiday) return null;

  const currentDate = new Date();
  const targetYear = year || currentDate.getFullYear();
  
  if (holiday.type === 'fixed') {
    // Set time to end of day (23:59:59) so holiday remains visible throughout the entire day
    const holidayDate = new Date(targetYear, holiday.month - 1, holiday.day!, 23, 59, 59, 999);
    
    // If the holiday has passed this year, suggest next year
    if (holidayDate < currentDate && !year) {
      const nextYearDate = new Date(targetYear + 1, holiday.month - 1, holiday.day!, 23, 59, 59, 999);
      return nextYearDate.toISOString().split('T')[0];
    }
    
    return holidayDate.toISOString().split('T')[0];
  }

  if (holiday.type === 'floating' && holiday.week && holiday.weekday !== undefined) {
    const firstOfMonth = new Date(targetYear, holiday.month - 1, 1);
    const firstWeekday = firstOfMonth.getDay();
    
    // Find the first occurrence of the target weekday
    const firstTarget = 1 + (holiday.weekday - firstWeekday + 7) % 7;
    
    // Calculate the date for the nth occurrence
    const targetDate = firstTarget + (holiday.week - 1) * 7;
    // Set time to end of day (23:59:59) so holiday remains visible throughout the entire day
    const holidayDate = new Date(targetYear, holiday.month - 1, targetDate, 23, 59, 59, 999);
    
    // If the holiday has passed this year, suggest next year
    if (holidayDate < currentDate && !year) {
      return calculateHolidayDate(holidayKey, targetYear + 1);
    }
    
    return holidayDate.toISOString().split('T')[0];
  }

  return null;
};

export const isKnownHoliday = (dateType: string): boolean => {
  return dateType in HOLIDAY_DATES;
};

/**
 * Detect if a given date matches any known holiday
 * Used for smart upsell prompts when user selects a holiday date for one-time scheduling
 * @param date - The date to check
 * @returns The holiday key (e.g., 'christmas', 'valentine') or null if no match
 */
export const detectHolidayFromDate = (date: Date): { key: string; label: string } | null => {
  const dateStr = date.toISOString().split('T')[0];
  
  const holidayLabels: Record<string, string> = {
    christmas: "Christmas",
    valentine: "Valentine's Day",
    mothers_day: "Mother's Day",
    fathers_day: "Father's Day",
  };
  
  for (const key of Object.keys(HOLIDAY_DATES)) {
    const holidayDate = calculateHolidayDate(key);
    if (holidayDate === dateStr) {
      return { key, label: holidayLabels[key] || key };
    }
  }
  return null;
};