
import { supabase } from "@/integrations/supabase/client";
import { ExtendedEventData } from "@/components/gifting/events/types";
import { EventCreateData, EventUpdateData } from "./eventTypes";
import { transformDatabaseEventToExtended } from "./eventTransformers";

export const eventCRUD = {
  // Fetch all events for the current user with complete recipient and auto-gifting data
  async fetchUserEvents(): Promise<ExtendedEventData[]> {
    const { data: userId } = await supabase.auth.getUser();
    if (!userId.user?.id) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_special_dates')
      .select(`
        *,
        user_connections!left (
          id,
          connected_user_id,
          pending_recipient_name,
          pending_recipient_email,
          relationship_type,
          status,
          profiles:connected_user_id (
            first_name,
            last_name,
            email,
            profile_image
          )
        ),
        auto_gifting_rules!left (
          id,
          budget_limit,
          is_active,
          gift_preferences,
          notification_preferences,
          gift_selection_criteria,
          pending_recipient_email,
          date_type
        )
      `)
      .eq('user_id', userId.user.id)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      throw error;
    }

    // For events that don't have direct connection links, try to find connections by matching names/emails
    const enrichedEvents = await Promise.all((data || []).map(async (event) => {
      // If connection is already linked, return as is
      if (event.user_connections) {
        return event;
      }

      // Try to find connection by extracting name from date_type
      const [eventType, personName] = event.date_type.includes(' - ') 
        ? event.date_type.split(' - ')
        : [event.date_type, null];

      if (personName) {
        const { data: connections } = await supabase
          .from('user_connections')
          .select(`
            id,
            connected_user_id,
            pending_recipient_name,
            pending_recipient_email,
            relationship_type,
            status,
            profiles:connected_user_id (
              first_name,
              last_name,
              email,
              profile_image
            )
          `)
          .eq('user_id', userId.user.id)
          .or(`pending_recipient_name.ilike.%${personName}%,profiles.first_name.ilike.%${personName}%,profiles.last_name.ilike.%${personName}%`);

        if (connections && connections.length > 0) {
          event.user_connections = connections[0];
        }
      }

      // Try to find auto_gifting_rules by event type and recipient email
      if (!event.auto_gifting_rules || event.auto_gifting_rules.length === 0) {
        const recipientEmail = event.user_connections?.pending_recipient_email || 
                              event.user_connections?.profiles?.email;
        
        if (recipientEmail || eventType) {
          const { data: rules } = await supabase
            .from('auto_gifting_rules')
            .select('*')
            .eq('user_id', userId.user.id)
            .or(`date_type.eq.${eventType},pending_recipient_email.eq.${recipientEmail}`)
            .order('created_at', { ascending: false });

          if (rules && rules.length > 0) {
            event.auto_gifting_rules = rules;
          }
        }
      }

      return event;
    }));

    return enrichedEvents.map(transformDatabaseEventToExtended);
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
