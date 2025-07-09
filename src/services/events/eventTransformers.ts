
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
    avatarUrl: "/placeholder.svg",
    autoGiftEnabled: false,
    autoGiftAmount: 0,
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
    occurrenceNumber: dbEvent.occurrence_number || 1
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
