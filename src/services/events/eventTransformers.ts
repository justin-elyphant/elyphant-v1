
import { ExtendedEventData } from "@/components/gifting/events/types";
import { EventCreateData } from "./eventTypes";

// Helper function to transform database records to ExtendedEventData format
export function transformDatabaseEventToExtended(dbEvent: any): ExtendedEventData {
  const eventDate = new Date(dbEvent.date);
  const today = new Date();
  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const [eventType, personName] = dbEvent.date_type.includes(' - ') 
    ? dbEvent.date_type.split(' - ')
    : [dbEvent.date_type, 'Unknown Person'];

  // Extract recipient information from user_connections join
  const connection = dbEvent.user_connections;
  const recipientEmail = connection?.pending_recipient_email || connection?.profiles?.email;
  const recipientName = connection?.pending_recipient_name || 
    (connection?.profiles ? `${connection.profiles.first_name} ${connection.profiles.last_name}` : personName);
  const relationshipType = connection?.relationship_type || 'friend';
  const avatarUrl = connection?.profiles?.profile_image || "/placeholder.svg";

  // Extract auto-gifting rule information
  const autoGiftingRule = dbEvent.auto_gifting_rules?.[0]; // Take first rule if multiple
  const autoGiftEnabled = autoGiftingRule?.is_active || false;
  const autoGiftAmount = autoGiftingRule?.budget_limit || 0;
  const giftCategories = autoGiftingRule?.gift_selection_criteria?.categories || [];
  const notificationDays = autoGiftingRule?.notification_preferences?.days_before || [7, 3, 1];

  return {
    id: dbEvent.id,
    type: eventType,
    person: recipientName,
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
    giftSelectionCriteria: autoGiftingRule?.gift_selection_criteria
  };
}

// Helper function to transform ExtendedEventData back to database format
export function transformExtendedEventToDatabase(event: ExtendedEventData, connectionId?: string): EventCreateData {
  return {
    date: event.dateObj?.toISOString() || new Date().toISOString(),
    date_type: `${event.type} - ${event.person}`,
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
