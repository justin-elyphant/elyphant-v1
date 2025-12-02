
interface Event {
  name: string;
  date: Date;
  type: string;
  personName?: string;
}

export const generateDynamicButtonText = (
  targetEvent: Event | null,
  isAuthenticated: boolean = false,
  friendName?: string
): string => {
  if (!targetEvent) {
    return "Shop Gifts";
  }

  // For friend events with authenticated users
  if (isAuthenticated && friendName && targetEvent.personName) {
    return `Shop Gifts for ${friendName}`;
  }

  // For holidays - extract the holiday name and format it properly
  const eventName = targetEvent.name;
  
  // Handle common holiday patterns
  if (eventName.toLowerCase().includes("father's day")) {
    return "Shop Father's Day Gifts";
  }
  if (eventName.toLowerCase().includes("mother's day")) {
    return "Shop Mother's Day Gifts";
  }
  if (eventName.toLowerCase().includes("christmas")) {
    return "Shop Christmas Gifts";
  }
  if (eventName.toLowerCase().includes("valentine")) {
    return "Shop Valentine's Day Gifts";
  }
  if (eventName.toLowerCase().includes("birthday")) {
    return isAuthenticated && friendName 
      ? `Shop Birthday Gifts for ${friendName}`
      : "Shop Birthday Gifts";
  }
  if (eventName.toLowerCase().includes("anniversary")) {
    return "Shop Anniversary Gifts";
  }
  if (eventName.toLowerCase().includes("graduation")) {
    return "Shop Graduation Gifts";
  }
  if (eventName.toLowerCase().includes("wedding")) {
    return "Shop Wedding Gifts";
  }
  if (eventName.toLowerCase().includes("holiday gifts")) {
    return "Shop Holiday Gifts";
  }
  if (eventName.toLowerCase().includes("hanukkah")) {
    return "Shop Hanukkah Gifts";
  }

  // Generic format for other events
  return `Shop ${eventName} Gifts`;
};

export const generateSearchQuery = (
  targetEvent: Event | null,
  friendName?: string
): string => {
  if (!targetEvent) {
    return "gifts";
  }

  // For friend events, be more specific
  if (friendName) {
    return `${targetEvent.name} gifts for ${friendName}`;
  }

  // For holidays, use the event name
  return `${targetEvent.name} gifts`;
};
