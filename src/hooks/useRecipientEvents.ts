import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

interface RecipientEvent {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientEmail?: string;
  eventType: string;
  eventDate: string;
  isRecurring: boolean;
  relationshipType: string;
  daysUntil: number;
  urgency: 'low' | 'medium' | 'high';
  hasAutoGift: boolean;
  connectionStatus: string;
}

export const useRecipientEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<RecipientEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipientEvents = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch connections with their special dates
        const { data: connections, error: connectionsError } = await supabase
          .from('user_connections')
          .select(`
            id,
            connected_user_id,
            relationship_type,
            status,
            connected_profile:profiles!user_connections_connected_user_id_fkey(
              id,
              name,
              first_name,
              last_name,
              email,
              dob
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'accepted');

        if (connectionsError) {
          throw connectionsError;
        }

        // Fetch user special dates for connected users
        const connectedUserIds = connections?.map(c => c.connected_user_id) || [];
        
        let specialDates: any[] = [];
        if (connectedUserIds.length > 0) {
          const { data: datesData, error: datesError } = await supabase
            .from('user_special_dates')
            .select('*')
            .in('user_id', connectedUserIds);

          if (datesError) {
            console.warn('Error fetching special dates:', datesError);
          } else {
            specialDates = datesData || [];
          }
        }

        // Check for existing auto-gift rules
        const { data: autoGiftRules, error: rulesError } = await supabase
          .from('auto_gifting_rules')
          .select('recipient_id, date_type')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (rulesError) {
          console.warn('Error fetching auto-gift rules:', rulesError);
        }

        // Process events
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const processedEvents: RecipientEvent[] = [];

        // Process connections and their dates
        connections?.forEach(connection => {
          const profile = connection.connected_profile as any;
          if (!profile) return;

          const recipientName = profile.name || 
                               (profile.first_name && profile.last_name ? 
                                `${profile.first_name} ${profile.last_name}` : 
                                profile.first_name) || 
                               profile.email?.split('@')[0] || 
                               'Unknown';

          // Add birthday from profile
          if (profile.dob) {
            const birthDate = new Date(profile.dob);
            const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
            const nextBirthday = thisYearBirthday >= today ? 
              thisYearBirthday : 
              new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
            
            const daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            // Check if auto-gift rule exists
            const hasAutoGift = autoGiftRules?.some(rule => 
              rule.recipient_id === profile.id && rule.date_type === 'birthday'
            ) || false;

            processedEvents.push({
              id: `birthday-${profile.id}`,
              recipientId: profile.id,
              recipientName,
              recipientEmail: profile.email,
              eventType: 'Birthday',
              eventDate: nextBirthday.toISOString().split('T')[0],
              isRecurring: true,
              relationshipType: connection.relationship_type || 'friend',
              daysUntil,
              urgency: daysUntil <= 7 ? 'high' : daysUntil <= 30 ? 'medium' : 'low',
              hasAutoGift,
              connectionStatus: connection.status
            });
          }

          // Add special dates for this user
          const userSpecialDates = specialDates.filter(date => date.user_id === profile.id);
          userSpecialDates.forEach(specialDate => {
            const eventDate = new Date(specialDate.date);
            const thisYearEvent = new Date(today.getFullYear(), eventDate.getMonth(), eventDate.getDate());
            const nextEvent = thisYearEvent >= today ? 
              thisYearEvent : 
              new Date(today.getFullYear() + 1, eventDate.getMonth(), eventDate.getDate());
            
            const daysUntil = Math.ceil((nextEvent.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            // Check if auto-gift rule exists
            const hasAutoGift = autoGiftRules?.some(rule => 
              rule.recipient_id === profile.id && rule.date_type === specialDate.date_type
            ) || false;

            const eventTypeMap: Record<string, string> = {
              'anniversary': 'Anniversary',
              'wedding': 'Wedding Anniversary',
              'graduation': 'Graduation',
              'promotion': 'Promotion',
              'custom': specialDate.custom_name || 'Special Day'
            };

            processedEvents.push({
              id: `special-${specialDate.id}`,
              recipientId: profile.id,
              recipientName,
              recipientEmail: profile.email,
              eventType: eventTypeMap[specialDate.date_type] || specialDate.date_type,
              eventDate: nextEvent.toISOString().split('T')[0],
              isRecurring: specialDate.is_recurring || false,
              relationshipType: connection.relationship_type || 'friend',
              daysUntil,
              urgency: daysUntil <= 7 ? 'high' : daysUntil <= 30 ? 'medium' : 'low',
              hasAutoGift,
              connectionStatus: connection.status
            });
          });
        });

        // Sort by urgency and date
        processedEvents.sort((a, b) => {
          if (a.urgency !== b.urgency) {
            const urgencyOrder = { high: 0, medium: 1, low: 2 };
            return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
          }
          return a.daysUntil - b.daysUntil;
        });

        setEvents(processedEvents);
      } catch (err) {
        console.error('Error fetching recipient events:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch recipient events');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipientEvents();
  }, [user]);

  return { events, loading, error, refetch: () => setLoading(true) };
};