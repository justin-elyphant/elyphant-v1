
import { supabase } from "@/integrations/supabase/client";
import { ExtendedEventData } from "@/components/gifting/events/types";

export interface EventCreateData {
  date: string;
  date_type: string;
  visibility: string;
  is_recurring?: boolean;
  recurring_type?: string;
  series_id?: string;
  end_date?: string;
  max_occurrences?: number;
  occurrence_number?: number;
}

export interface EventUpdateData extends Partial<EventCreateData> {
  id: string;
}

export interface SeriesUpdateData {
  series_id: string;
  updates: Partial<EventCreateData>;
  apply_to_future_only?: boolean;
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

    return (data || []).map(transformDatabaseEventToExtended);
  },

  // Create a new event (single or recurring series)
  async createEvent(eventData: EventCreateData): Promise<ExtendedEventData> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    // For recurring events, set series_id to the event's own id initially
    const newEventData = {
      user_id: userId,
      ...eventData,
      series_id: eventData.is_recurring ? undefined : null, // Will be set after insert for recurring
    };

    const { data, error } = await supabase
      .from('user_special_dates')
      .insert([newEventData])
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      throw error;
    }

    // For recurring events, update the series_id to match the event id
    if (eventData.is_recurring) {
      await supabase
        .from('user_special_dates')
        .update({ series_id: data.id })
        .eq('id', data.id);
      
      data.series_id = data.id;
    }

    return transformDatabaseEventToExtended(data);
  },

  // Update a single event instance
  async updateEvent(eventData: EventUpdateData): Promise<ExtendedEventData> {
    const { id, ...updateFields } = eventData;
    
    // Mark as modified if it's part of a recurring series
    const event = await this.getEventById(id);
    if (event?.is_recurring) {
      updateFields.is_modified = true;
    }
    
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

  // Update entire recurring series
  async updateSeries(seriesData: SeriesUpdateData): Promise<ExtendedEventData[]> {
    const { series_id, updates, apply_to_future_only } = seriesData;
    
    let query = supabase
      .from('user_special_dates')
      .update(updates)
      .eq('series_id', series_id);

    // If applying to future only, filter by date
    if (apply_to_future_only) {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('date', today);
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('Error updating series:', error);
      throw error;
    }

    return (data || []).map(transformDatabaseEventToExtended);
  },

  // Get a specific event by ID
  async getEventById(eventId: string): Promise<any> {
    const { data, error } = await supabase
      .from('user_special_dates')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      throw error;
    }

    return data;
  },

  // Get all events in a series
  async getSeriesEvents(seriesId: string): Promise<ExtendedEventData[]> {
    const { data, error } = await supabase
      .from('user_special_dates')
      .select('*')
      .eq('series_id', seriesId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching series events:', error);
      throw error;
    }

    return (data || []).map(transformDatabaseEventToExtended);
  },

  // Mark event as completed and create next recurring instance if applicable
  async markEventCompleted(eventId: string): Promise<void> {
    const event = await this.getEventById(eventId);

    if (!event) {
      throw new Error('Event not found');
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
  async createNextRecurringEvent(originalEvent: any): Promise<ExtendedEventData | null> {
    // Check if we've reached the end date or max occurrences
    if (originalEvent.end_date) {
      const endDate = new Date(originalEvent.end_date);
      const eventDate = new Date(originalEvent.date);
      if (eventDate >= endDate) {
        return null; // Don't create next occurrence
      }
    }

    if (originalEvent.max_occurrences) {
      const seriesEvents = await this.getSeriesEvents(originalEvent.series_id);
      if (seriesEvents.length >= originalEvent.max_occurrences) {
        return null; // Don't create next occurrence
      }
    }

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
      series_id: originalEvent.series_id,
      end_date: originalEvent.end_date,
      max_occurrences: originalEvent.max_occurrences,
      occurrence_number: (originalEvent.occurrence_number || 1) + 1,
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

  // Delete event with series management
  async deleteEvent(eventId: string, deleteOption: 'this_only' | 'all_future' | 'entire_series' = 'this_only'): Promise<void> {
    const event = await this.getEventById(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }

    switch (deleteOption) {
      case 'this_only':
        // Delete just this event
        const { error } = await supabase
          .from('user_special_dates')
          .delete()
          .eq('id', eventId);

        if (error) {
          console.error('Error deleting event:', error);
          throw error;
        }
        break;

      case 'all_future':
        // Delete this event and all future occurrences
        const { error: futureError } = await supabase
          .from('user_special_dates')
          .delete()
          .eq('series_id', event.series_id)
          .gte('date', event.date);

        if (futureError) {
          console.error('Error deleting future events:', futureError);
          throw futureError;
        }
        break;

      case 'entire_series':
        // Delete all events in the series
        const { error: seriesError } = await supabase
          .from('user_special_dates')
          .delete()
          .eq('series_id', event.series_id);

        if (seriesError) {
          console.error('Error deleting series:', seriesError);
          throw seriesError;
        }
        break;
    }
  }
};

// Helper function to transform database records to ExtendedEventData format
function transformDatabaseEventToExtended(dbEvent: any): ExtendedEventData {
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
export function transformExtendedEventToDatabase(event: ExtendedEventData): EventCreateData {
  return {
    date: event.dateObj?.toISOString() || new Date().toISOString(),
    date_type: `${event.type} - ${event.person}`,
    visibility: event.privacyLevel,
    is_recurring: event.isRecurring,
    recurring_type: event.recurringType,
    series_id: event.seriesId,
    end_date: event.endDate,
    max_occurrences: event.maxOccurrences,
    occurrence_number: event.occurrenceNumber
  };
}
