import { UnifiedGiftRule } from "@/services/UnifiedGiftManagementService";

/**
 * Convert technical date_type to shopper-friendly occasion names
 */
export const getOccasionDisplayName = (dateType: string): string => {
  const occasionMap: Record<string, string> = {
    'birthday': 'Birthday',
    'christmas': 'Christmas',
    'mothers_day': "Mother's Day",
    'fathers_day': "Father's Day",
    'valentine': "Valentine's Day",
    'valentines_day': "Valentine's Day",
    'anniversary': 'Anniversary',
    'graduation': 'Graduation',
    'promotion': 'Promotion',
    'wedding': 'Wedding',
    'housewarming': 'Housewarming',
    'baby_shower': 'Baby Shower',
    'retirement': 'Retirement',
    'other': 'Special Occasion'
  };
  
  return occasionMap[dateType.toLowerCase()] || dateType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Generate friendly recurrence description for auto-gifts
 */
export const getRecurrenceDescription = (rule: UnifiedGiftRule): string => {
  const dateType = rule.date_type;
  
  // For birthdays and recurring events
  if (dateType === 'birthday') {
    return 'Sends automatically every year';
  }
  
  if (dateType === 'anniversary') {
    return 'Sends automatically every year';
  }
  
  // For holiday events
  const holidayDates: Record<string, string> = {
    'christmas': 'December 25th',
    'mothers_day': "Mother's Day",
    'fathers_day': "Father's Day",
    'valentine': 'February 14th',
    'valentines_day': 'February 14th',
  };
  
  if (holidayDates[dateType.toLowerCase()]) {
    return `Sends automatically every ${holidayDates[dateType.toLowerCase()]}`;
  }
  
  return 'Sends automatically';
};

/**
 * Convert gift source to friendly display text
 */
export const getSourceDisplayName = (source?: string): string => {
  if (!source) return 'Smart Selection';
  
  const sourceMap: Record<string, string> = {
    'wishlist': 'From Wishlist',
    'ai': 'AI-Powered Selection',
    'both': 'Wishlist + AI',
    'specific': 'Specific Product'
  };
  
  return sourceMap[source] || 'Smart Selection';
};

/**
 * Format budget for display
 */
export const formatBudgetDisplay = (budget?: number): string => {
  if (!budget) return 'Up to $50';
  return `Up to $${budget}`;
};

/**
 * Get recipient display name (handles both profiles and pending invitations)
 */
export const getRecipientDisplayName = (rule: UnifiedGiftRule): string => {
  // If we have a profile, use the name
  if (rule.recipient?.name) {
    return rule.recipient.name;
  }
  
  // For pending invitations, format the email
  if (rule.pending_recipient_email) {
    const emailName = rule.pending_recipient_email.split('@')[0];
    return emailName
      .replace(/[._]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  return 'Unknown Recipient';
};

/**
 * Check if this is a pending invitation
 */
export const isPendingInvitation = (rule: UnifiedGiftRule): boolean => {
  return rule.recipient_id === null && !!rule.pending_recipient_email;
};
