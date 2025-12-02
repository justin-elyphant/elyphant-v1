
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

  // For friend-specific events (connection events), personalize the button
  if (friendName && (targetEvent.personName || targetEvent.type === 'birthday' || targetEvent.type === 'anniversary')) {
    const firstName = friendName.split(' ')[0];
    if (targetEvent.type === 'birthday') {
      return `Shop ${firstName}'s Birthday Gift`;
    }
    if (targetEvent.type === 'anniversary') {
      return `Shop ${firstName}'s Anniversary Gift`;
    }
    return `Shop ${firstName}'s Gift`;
  }

  // For holiday events, use the holiday name
  const eventName = targetEvent.name.toLowerCase();
  
  // Check for connection event patterns (e.g., "Emma's Birthday")
  if (eventName.includes("'s birthday")) {
    const name = targetEvent.name.split("'s")[0];
    return `Shop ${name}'s Birthday Gift`;
  }
  
  if (eventName.includes("'s anniversary")) {
    const name = targetEvent.name.split("'s")[0];
    return `Shop ${name}'s Anniversary Gift`;
  }
  
  if (eventName.includes("holiday gifts")) {
    return "Shop Holiday Gifts";
  }
  
  if (eventName.includes("hanukkah")) {
    return "Shop Hanukkah Gifts";
  }
  
  if (eventName.includes("christmas")) {
    return "Shop Christmas Gifts";
  }
  
  if (eventName.includes("valentine")) {
    return "Shop Valentine's Day Gifts";
  }
  
  if (eventName.includes("mother")) {
    return "Shop Mother's Day Gifts";
  }
  
  if (eventName.includes("father")) {
    return "Shop Father's Day Gifts";
  }
  
  if (eventName.includes("black friday")) {
    return "Shop Black Friday Deals";
  }
  
  if (eventName.includes("cyber monday")) {
    return "Shop Cyber Monday Deals";
  }
  
  if (eventName.includes("birthday")) {
    return isAuthenticated && friendName 
      ? `Shop Birthday Gifts for ${friendName}`
      : "Shop Birthday Gifts";
  }
  
  if (eventName.includes("anniversary")) {
    return "Shop Anniversary Gifts";
  }
  
  if (eventName.includes("graduation")) {
    return "Shop Graduation Gifts";
  }
  
  if (eventName.includes("wedding")) {
    return "Shop Wedding Gifts";
  }

  // Generic format for other events
  return `Shop ${targetEvent.name} Gifts`;
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
