
import React, { createContext, useContext, useState, useEffect } from "react";
import { ExtendedEventData, FilterOption } from "../types";
import { eventsService } from "@/services/eventsService";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

type EventsContextProps = {
  events: ExtendedEventData[];
  setEvents: React.Dispatch<React.SetStateAction<ExtendedEventData[]>>;
  currentEvent: ExtendedEventData | null;
  setCurrentEvent: React.Dispatch<React.SetStateAction<ExtendedEventData | null>>;
  isEditDrawerOpen: boolean;
  setIsEditDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  viewMode: "cards" | "calendar";
  setViewMode: React.Dispatch<React.SetStateAction<"cards" | "calendar">>;
  selectedEventType: FilterOption;
  setSelectedEventType: React.Dispatch<React.SetStateAction<FilterOption>>;
  isLoading: boolean;
  error: string | null;
  refreshEvents: () => Promise<void>;
};

const EventsContext = createContext<EventsContextProps | undefined>(undefined);

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<ExtendedEventData[]>([]);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<ExtendedEventData | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "calendar">("cards");
  const [selectedEventType, setSelectedEventType] = useState<FilterOption>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Fetch events when component mounts or user changes
  useEffect(() => {
    if (user) {
      refreshEvents();
    } else {
      setEvents([]);
      setIsLoading(false);
    }
  }, [user]);

  const refreshEvents = async () => {
    if (!user) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const fetchedEvents = await eventsService.fetchUserEvents();
      setEvents(fetchedEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
      toast.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <EventsContext.Provider
      value={{
        events,
        setEvents,
        currentEvent,
        setCurrentEvent,
        isEditDrawerOpen,
        setIsEditDrawerOpen,
        viewMode,
        setViewMode,
        selectedEventType,
        setSelectedEventType,
        isLoading,
        error,
        refreshEvents,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error("useEvents must be used within an EventsProvider");
  }
  return context;
};
