
import { supabase } from "@/integrations/supabase/client";
import { ExtendedEventData } from "@/components/gifting/events/types";

export interface EventCreateData {
  date: string;
  date_type: string;
  visibility: string;
  is_recurring?: boolean;
  recurring_type?: string;
}

export interface EventUpdateData extends Partial<EventCreateData> {
  id: string;
}

export const eventsService = {
  // Fetch all events for the current user
  async fetchUserEvents(): Promise<ExtendedEventData[]> {
    const { data, error } = await supabase
      .from('user_special_dates')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      throw error;
    }

    // Transform database records to ExtendedEventData format
    return (data || []).map(transformDatabaseEventToExtended);
  },

  // Create a new event
  async createEvent(eventData: EventCreateData): Promise<ExtendedEventData> {
    const { data, error } = await supabase
      .from('user_special_dates')
      .insert([{
        user_id: (await supabase.auth.getUser()).data.user?.id,
        ...eventData
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      throw error;
    }

    return transformDatabaseEventToExtended(data);
  },

  // Update an existing event
  async updateEvent(eventData: EventUpdateData): Promise<ExtendedEventData> {
    const { id, ...updateFields } = eventData;
    
    const { data, error } = await supabase
      .from('user_special_dates')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      throw error;
    }

    return transformDatabaseEventToExtended(data);
  },

  // Mark event as completed and create next recurring instance if applicable
  async markEventCompleted(eventId: string): Promise<void> {
    // Get the event details first
    const { data: event, error: fetchError } = await supabase
      .from('user_special_dates')
      .select('*')
      .eq('id', eventId)
      .single();

    if (fetchError) {
      console.error('Error fetching event:', fetchError);
      throw fetchError;
    }

    // Mark as completed (you could add a completed_at field if needed)
    const { error: updateError } = await supabase
      .from('user_special_dates')
      .update({ 
        updated_at: new Date().toISOString() 
      })
      .eq('id', eventId);

    if (updateError) {
      console.error('Error marking event as completed:', updateError);
      throw updateError;
    }

    // If it's a recurring event, create the next instance
    if (event.is_recurring && event.recurring_type) {
      await this.createNextRecurringEvent(event);
    }
  },

  // Create the next recurring event instance
  async createNextRecurringEvent(originalEvent: any): Promise<ExtendedEventData> {
    const originalDate = new Date(originalEvent.date);
    let nextDate = new Date(originalDate);

    // Calculate next occurrence based on recurring type
    switch (originalEvent.recurring_type) {
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        // For custom or unspecified, default to yearly
        nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    // Create new event for next occurrence
    const newEventData = {
      user_id: originalEvent.user_id,
      date: nextDate.toISOString().split('T')[0],
      date_type: originalEvent.date_type,
      visibility: originalEvent.visibility,
      is_recurring: true,
      recurring_type: originalEvent.recurring_type,
      original_event_id: originalEvent.original_event_id || originalEvent.id,
    };

    const { data, error } = await supabase
      .from('user_special_dates')
      .insert([newEventData])
      .select()
      .single();

    if (error) {
      console.error('Error creating recurring event:', error);
      throw error;
    }

    return transformDatabaseEventToExtended(data);
  },

  // Delete an event and optionally all future recurring instances
  async deleteEvent(eventId: string, deleteAllRecurring = false): Promise<void> {
    if (deleteAllRecurring) {
      // Get the original event ID
      const { data: event } = await supabase
        .from('user_special_dates')
        .select('original_event_id, id')
        .eq('id', eventId)
        .single();

      const originalId = event?.original_event_id || eventId;

      // Delete all events in the recurring chain
      const { error } = await supabase
        .from('user_special_dates')
        .delete()
        .or(`id.eq.${originalId},original_event_id.eq.${originalId}`);

      if (error) {
        console.error('Error deleting recurring events:', error);
        throw error;
      }
    } else {
      // Delete just this event
      const { error } = await supabase
        .from('user_special_dates')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('Error deleting event:', error);
        throw error;
      }
    }
  }
};

// Helper function to transform database records to ExtendedEventData format
function transformDatabaseEventToExtended(dbEvent: any): ExtendedEventData {
  // Parse the date and calculate days away
  const eventDate = new Date(dbEvent.date);
  const today = new Date();
  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Extract person name and event type from date_type
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
    originalEventId: dbEvent.original_event_id
  };
}

// Helper function to transform ExtendedEventData back to database format
export function transformExtendedEventToDatabase(event: ExtendedEventData): EventCreateData {
  return {
    date: event.dateObj?.toISOString() || new Date().toISOString(),
    date_type: `${event.type} - ${event.person}`,
    visibility: event.privacyLevel,
    is_recurring: event.isRecurring,
    recurring_type: event.recurringType
  };
}
