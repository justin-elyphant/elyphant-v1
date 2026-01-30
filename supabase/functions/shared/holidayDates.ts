// Holiday date calculations for auto-gift orchestrator
// Copied from src/constants/holidayDates.ts for edge function usage

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
};

/**
 * Calculate next birthday from MM-DD format
 * Returns the next occurrence (this year if not passed, next year if passed)
 */
export const calculateNextBirthday = (dob: string, referenceDate?: Date): string | null => {
  if (!dob) return null;
  
  const now = referenceDate || new Date();
  let month: number, day: number;
  
  // Handle both MM-DD and full date formats
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
  
  const currentYear = now.getFullYear();
  const thisYearBirthday = new Date(currentYear, month - 1, day, 12, 0, 0);
  
  // If birthday has passed this year, return next year's date
  if (thisYearBirthday < now) {
    return new Date(currentYear + 1, month - 1, day, 12, 0, 0).toISOString().split('T')[0];
  }
  
  return thisYearBirthday.toISOString().split('T')[0];
};

/**
 * Calculate the next occurrence of a holiday
 * Handles both fixed dates (Christmas) and floating dates (Mother's Day, Father's Day)
 */
export const calculateHolidayDate = (holidayKey: string, referenceDate?: Date): string | null => {
  const holiday = HOLIDAY_DATES[holidayKey];
  if (!holiday) return null;

  const currentDate = referenceDate || new Date();
  const targetYear = currentDate.getFullYear();
  
  if (holiday.type === 'fixed') {
    // Set time to end of day so holiday remains visible throughout the day
    const holidayDate = new Date(targetYear, holiday.month - 1, holiday.day!, 23, 59, 59, 999);
    
    // If the holiday has passed this year, return next year
    if (holidayDate < currentDate) {
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
    const holidayDate = new Date(targetYear, holiday.month - 1, targetDate, 23, 59, 59, 999);
    
    // If the holiday has passed this year, calculate for next year
    if (holidayDate < currentDate) {
      return calculateHolidayDate(holidayKey, new Date(targetYear + 1, 0, 1));
    }
    
    return holidayDate.toISOString().split('T')[0];
  }

  return null;
};
