
import { ExtendedEventData } from "@/components/gifting/events/types";
import { EventCreateData } from "./eventTypes";

// Helper function to determine event category
function determineEventCategory(dbEvent: any): 'self' | 'others' | 'shared' {
  const connection = dbEvent.user_connections;
  
  // If no connection and it's a birthday, it's the user's own birthday
  if (!connection && dbEvent.date_type === 'birthday') {
    return 'self';
  }
  
  // If there's a connection but it's marked as shared (like anniversary with spouse)
  if (connection && connection.relationship_type === 'spouse' && 
      (dbEvent.date_type.includes('anniversary') || dbEvent.date_type.includes('valentine'))) {
    return 'shared';
  }
  
  // Default to others (friends' birthdays, etc.)
  return 'others';
}

// Helper function to get the display person name based on event category
function getEventPersonName(dbEvent: any, category: 'self' | 'others' | 'shared'): string {
  const connection = dbEvent.user_connections;
  
  if (category === 'self') {
    return 'Me'; // User's own events
  }
  
  if (connection) {
    const recipientName = connection.pending_recipient_name || 
      (connection.profiles ? `${connection.profiles.first_name} ${connection.profiles.last_name}`.trim() : null);
    
    if (recipientName) {
      return recipientName;
    }
  }
  
  // Fallback: try to extract from date_type if it has the format "type - name"
  if (dbEvent.date_type.includes(' - ')) {
    const [, personName] = dbEvent.date_type.split(' - ');
    return personName || 'Unknown Person';
  }
  
  return 'Unknown Person';
}

// Helper function to get event type from date_type
function getEventType(dateType: string): string {
  if (dateType.includes(' - ')) {
    return dateType.split(' - ')[0];
  }
  return dateType;
}

// Helper function to transform database records to ExtendedEventData format
export function transformDatabaseEventToExtended(dbEvent: any): ExtendedEventData {
  const eventDate = new Date(dbEvent.date);
  const today = new Date();
  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const eventType = getEventType(dbEvent.date_type);
  const eventCategory = determineEventCategory(dbEvent);
  const personName = getEventPersonName(dbEvent, eventCategory);

  // Extract recipient information from user_connections join
  const connection = dbEvent.user_connections;
  const recipientEmail = connection?.pending_recipient_email || connection?.profiles?.email || "";
  const relationshipType = connection?.relationship_type || 'friend';
  const avatarUrl = connection?.profiles?.profile_image || "/placeholder.svg";

  // Extract auto-gifting rule information - handle array or single object
  const autoGiftingRules = Array.isArray(dbEvent.auto_gifting_rules) 
    ? dbEvent.auto_gifting_rules 
    : (dbEvent.auto_gifting_rules ? [dbEvent.auto_gifting_rules] : []);
  
  // Find the most relevant rule - prioritize by date_type match, then by active status, then by most recent
  const autoGiftingRule = autoGiftingRules.find(rule => rule.date_type === eventType && rule.is_active) ||
                          autoGiftingRules.find(rule => rule.is_active) ||
                          autoGiftingRules.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
  
  const autoGiftEnabled = autoGiftingRule?.is_active || false;
  const autoGiftAmount = autoGiftingRule?.budget_limit || 0;
  const giftCategories = autoGiftingRule?.gift_selection_criteria?.categories || [];
  const notificationDays = autoGiftingRule?.notification_preferences?.days_before || [7, 3, 1];

  return {
    id: dbEvent.id,
    type: eventType,
    person: personName,
    date: eventDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    daysAway: Math.max(0, diffDays),
    avatarUrl,
    autoGiftEnabled,
    autoGiftAmount,
    privacyLevel: dbEvent.visibility || 'private',
    isVerified: true,
    needsVerification: false,
    giftSource: "wishlist",
    dateObj: eventDate,
    isRecurring: dbEvent.is_recurring || false,
    recurringType: dbEvent.recurring_type,
    originalEventId: dbEvent.original_event_id,
    // New series management fields
    seriesId: dbEvent.series_id,
    endDate: dbEvent.end_date,
    maxOccurrences: dbEvent.max_occurrences,
    isModified: dbEvent.is_modified || false,
    occurrenceNumber: dbEvent.occurrence_number || 1,
    // Recipient connection details
    recipientEmail,
    relationshipType,
    connectionId: connection?.id,
    connectionStatus: connection?.status,
    // Auto-gifting rule details
    giftingRuleId: autoGiftingRule?.id,
    giftCategories,
    notificationDays,
    giftSelectionCriteria: autoGiftingRule?.gift_selection_criteria,
    // Event categorization
    eventCategory,
    isUserRecipient: eventCategory === 'self',
    isSharedEvent: eventCategory === 'shared'
  };
}

// Helper function to transform ExtendedEventData back to database format
export function transformExtendedEventToDatabase(event: ExtendedEventData, connectionId?: string): EventCreateData {
  return {
    date: event.dateObj?.toISOString() || new Date().toISOString(),
    date_type: event.eventCategory === 'self' ? event.type : `${event.type} - ${event.person}`,
    visibility: event.privacyLevel,
    connection_id: connectionId,
    is_recurring: event.isRecurring,
    recurring_type: event.recurringType,
    series_id: event.seriesId,
    end_date: event.endDate,
    max_occurrences: event.maxOccurrences,
    occurrence_number: event.occurrenceNumber
  };
}
