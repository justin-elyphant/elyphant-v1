
import { format, parseISO, isValid } from "date-fns";

export const formatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return "Invalid date";
    }
    return format(date, "MMMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return "Invalid date";
    }
    return format(date, "MMMM d, yyyy 'at' h:mm a");
  } catch (error) {
    console.error("Error formatting datetime:", error);
    return "Invalid date";
  }
};

export const formatRelativeDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return "Invalid date";
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return "Today";
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return format(date, "MMM d, yyyy");
    }
  } catch (error) {
    console.error("Error formatting relative date:", error);
    return "Invalid date";
  }
};

export const formatScheduledDate = (dateString: string): string => {
  try {
    // Handle YYYY-MM-DD format safely by parsing as local date
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      if (!isValid(date)) {
        return "Invalid date";
      }
      return format(date, "MMMM d, yyyy");
    }
    
    // For other date formats, use parseISO
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return "Invalid date";
    }
    return format(date, "MMMM d, yyyy");
  } catch (error) {
    console.error("Error formatting scheduled date:", error);
    return "Invalid date";
  }
};

export const formatScheduledDateTime = (dateString: string, timeFormat: string = "EEEE, MMMM d, yyyy"): string => {
  try {
    // Handle YYYY-MM-DD format safely by parsing as local date
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      if (!isValid(date)) {
        return "Invalid date";
      }
      return format(date, timeFormat);
    }
    
    // For other date formats, use parseISO
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return "Invalid date";
    }
    return format(date, timeFormat);
  } catch (error) {
    console.error("Error formatting scheduled datetime:", error);
    return "Invalid date";
  }
};
