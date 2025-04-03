
import { format, isToday } from "date-fns";

// Function to parse various date formats
export function parseDateString(dateStr: string): Date | null {
  try {
    // Handle formats like "May 15, 2023"
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    return null;
  } catch (e) {
    console.error("Failed to parse date:", dateStr);
    return null;
  }
}

// Format date for display
export const formatEventDate = (date: Date | null) => {
  if (!date) return "";
  return format(date, "MMMM d, yyyy");
};

// Function to determine urgency class for dates
export const getUrgencyClass = (days: number) => {
  if (days <= 7) return "text-red-600 font-semibold";
  if (days <= 14) return "text-amber-600";
  return "text-muted-foreground";
};
