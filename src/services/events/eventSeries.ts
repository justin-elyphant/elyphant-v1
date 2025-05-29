
import { supabase } from "@/integrations/supabase/client";
import { ExtendedEventData } from "@/components/gifting/events/types";
import { SeriesUpdateData } from "./eventTypes";
import { transformDatabaseEventToExtended } from "./eventTransformers";

export const eventSeries = {
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

  // Mark event as completed and create next recurring instance if applicable
  async markEventCompleted(eventId: string): Promise<void> {
    const { eventCRUD } = await import('./eventCRUD');
    const event = await eventCRUD.getEventById(eventId);

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
  }
};
