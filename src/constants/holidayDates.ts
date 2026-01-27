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

// Preset holidays for quick selection UI
// Birthday is dynamic (from recipient profile), others use HOLIDAY_DATES
export interface PresetHoliday {
  label: string;
  icon: string;
  dynamic?: boolean; // If true, date comes from recipient data (e.g., birthday)
}

export const PRESET_HOLIDAYS: Record<string, PresetHoliday> = {
  birthday: { label: "Birthday", icon: "🎂", dynamic: true },
  christmas: { label: "Christmas", icon: "🎄" },
  valentine: { label: "Valentine's Day", icon: "💝" },
  mothers_day: { label: "Mother's Day", icon: "👩" },
  fathers_day: { label: "Father's Day", icon: "👨" }
};

/**
 * Calculate next birthday from MM-DD format
 * Returns the next occurrence (this year if not passed, next year if passed)
 */
export const calculateNextBirthday = (dob: string): Date | null => {
  if (!dob) return null;
  
  // Handle both MM-DD and full date formats
  let month: number, day: number;
  
  if (dob.includes('-') && dob.length <= 5) {
    // MM-DD format
    [month, day] = dob.split('-').map(Number);
  } else if (dob.includes('-')) {
    // YYYY-MM-DD or full ISO format
    const dateParts = dob.split('T')[0].split('-');
    month = parseInt(dateParts[1]);
    day = parseInt(dateParts[2]);
  } else {
    return null;
  }
  
  if (!month || !day || isNaN(month) || isNaN(day)) return null;
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const thisYearBirthday = new Date(currentYear, month - 1, day, 12, 0, 0);
  
  // If birthday has passed this year, return next year's date
  if (thisYearBirthday < now) {
    return new Date(currentYear + 1, month - 1, day, 12, 0, 0);
  }
  
  return thisYearBirthday;
};

/**
 * Format birthday date for display (e.g., "Mar 15")
 */
export const formatBirthdayForChip = (dob: string): string | null => {
  const nextBirthday = calculateNextBirthday(dob);
  if (!nextBirthday) return null;
  
  return nextBirthday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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