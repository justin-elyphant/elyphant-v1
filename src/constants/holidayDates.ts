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
    const holidayDate = new Date(targetYear, holiday.month - 1, holiday.day!);
    
    // If the holiday has passed this year, suggest next year
    if (holidayDate < currentDate && !year) {
      return new Date(targetYear + 1, holiday.month - 1, holiday.day!).toISOString().split('T')[0];
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
    const holidayDate = new Date(targetYear, holiday.month - 1, targetDate);
    
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