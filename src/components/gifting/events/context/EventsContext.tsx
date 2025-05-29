
import React, { createContext, useState, useEffect, useContext } from "react";
import { ExtendedEventData } from "../types";
import { eventsService } from "@/services/eventsService";

interface EventsContextType {
  events: ExtendedEventData[];
  setEvents: (events: ExtendedEventData[]) => void;
  isLoading: boolean;
  error: string | null;
  editingEvent: ExtendedEventData | null;
  setEditingEvent: (event: ExtendedEventData | null) => void;
  currentEvent: ExtendedEventData | null;
  setCurrentEvent: (event: ExtendedEventData | null) => void;
  isEditDrawerOpen: boolean;
  setIsEditDrawerOpen: (open: boolean) => void;
  refreshEvents: () => Promise<void>;
  updateEvent: (eventId: string, updates: any) => Promise<void>;
  deleteEvent: (eventId: string, options: any) => Promise<void>;
  viewMode: "cards" | "calendar" | "list";
  setViewMode: (mode: "cards" | "calendar" | "list") => void;
  selectedEventType: string;
  setSelectedEventType: (type: string) => void;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider = ({ children }: { children: React.ReactNode }) => {
  const [events, setEvents] = useState<ExtendedEventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<ExtendedEventData | null>(null);
  const [currentEvent, setCurrentEvent] = useState<ExtendedEventData | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "calendar" | "list">("cards");
  const [selectedEventType, setSelectedEventType] = useState<string>("all");

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const fetchedEvents = await eventsService.fetchUserEvents();
        setEvents(fetchedEvents);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load events");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const refreshEvents = async () => {
    setIsLoading(true);
    try {
      const fetchedEvents = await eventsService.fetchUserEvents();
      setEvents(fetchedEvents);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load events");
    } finally {
      setIsLoading(false);
    }
  };

  const updateEvent = async (eventId: string, updates: any) => {
    try {
      await eventsService.updateEvent({ id: eventId, ...updates });
      await refreshEvents(); // Refresh events after update
    } catch (err: any) {
      setError(err.message || "Failed to update event");
      throw err;
    }
  };

  const deleteEvent = async (eventId: string, options: any) => {
    try {
      await eventsService.deleteEvent(eventId, options);
      await refreshEvents(); // Refresh events after delete
    } catch (err: any) {
      setError(err.message || "Failed to delete event");
      throw err;
    }
  };

  const value = {
    events,
    setEvents,
    isLoading,
    error,
    editingEvent,
    setEditingEvent,
    currentEvent,
    setCurrentEvent,
    isEditDrawerOpen,
    setIsEditDrawerOpen,
    refreshEvents,
    updateEvent,
    deleteEvent,
    viewMode,
    setViewMode,
    selectedEventType,
    setSelectedEventType
  };

  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error("useEvents must be used within a EventsProvider");
  }
  return context;
};
