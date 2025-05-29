
import { supabase } from "@/integrations/supabase/client";
import { ExtendedEventData } from "@/components/gifting/events/types";

export interface EventCreateData {
  date: string;
  date_type: string;
  visibility: string;
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

  // Mark event as completed
  async markEventCompleted(eventId: string): Promise<void> {
    const { error } = await supabase
      .from('user_special_dates')
      .update({ 
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      })
      .eq('id', eventId);

    if (error) {
      console.error('Error marking event as completed:', error);
      throw error;
    }
  },

  // Create recurring event
  async createRecurringEvent(originalEventId: string): Promise<ExtendedEventData> {
    // Get the original event
    const { data: originalEvent, error: fetchError } = await supabase
      .from('user_special_dates')
      .select('*')
      .eq('id', originalEventId)
      .single();

    if (fetchError) {
      console.error('Error fetching original event:', fetchError);
      throw fetchError;
    }

    // Calculate next year's date
    const originalDate = new Date(originalEvent.date);
    const nextYear = new Date(originalDate);
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    // Create new event for next year
    const newEventData = {
      user_id: originalEvent.user_id,
      date: nextYear.toISOString().split('T')[0], // Format as YYYY-MM-DD
      date_type: originalEvent.date_type,
      visibility: originalEvent.visibility,
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

  // Delete an event
  async deleteEvent(eventId: string): Promise<void> {
    const { error } = await supabase
      .from('user_special_dates')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error deleting event:', error);
      throw error;
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
  // Format: "Birthday - John Doe" or just "Anniversary"
  const [eventType, personName] = dbEvent.date_type.includes(' - ') 
    ? dbEvent.date_type.split(' - ')
    : [dbEvent.date_type, 'Unknown Person'];

  return {
    id: dbEvent.id, // Keep as UUID string
    type: eventType,
    person: personName,
    date: eventDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    daysAway: Math.max(0, diffDays),
    avatarUrl: "/placeholder.svg",
    autoGiftEnabled: false, // Will be enhanced with auto_gifting_rules later
    autoGiftAmount: 0,
    privacyLevel: dbEvent.visibility || 'private',
    isVerified: true,
    needsVerification: false,
    giftSource: "wishlist",
    dateObj: eventDate
  };
}

// Helper function to transform ExtendedEventData back to database format
export function transformExtendedEventToDatabase(event: ExtendedEventData): EventCreateData {
  return {
    date: event.dateObj?.toISOString() || new Date().toISOString(),
    date_type: `${event.type} - ${event.person}`,
    visibility: event.privacyLevel
  };
}
