
import { useEffect, useCallback } from "react";
import { ExtendedEventData } from "../types";

interface UseKeyboardNavigationProps {
  events: ExtendedEventData[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string | null) => void;
  onEditEvent: (eventId: string) => void;
  onDeleteEvent?: (eventId: string) => void;
}

export const useKeyboardNavigation = ({
  events,
  selectedEventId,
  onSelectEvent,
  onEditEvent,
  onDeleteEvent,
}: UseKeyboardNavigationProps) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!events.length) return;

    const currentIndex = selectedEventId 
      ? events.findIndex(e => e.id === selectedEventId)
      : -1;

    switch (event.key) {
      case 'ArrowDown':
      case 'j': // Vim-style navigation
        event.preventDefault();
        const nextIndex = currentIndex < events.length - 1 ? currentIndex + 1 : 0;
        onSelectEvent(events[nextIndex].id);
        break;

      case 'ArrowUp':
      case 'k': // Vim-style navigation
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : events.length - 1;
        onSelectEvent(events[prevIndex].id);
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (selectedEventId) {
          onEditEvent(selectedEventId);
        }
        break;

      case 'Delete':
      case 'Backspace':
        if (selectedEventId && onDeleteEvent) {
          event.preventDefault();
          onDeleteEvent(selectedEventId);
        }
        break;

      case 'Escape':
        event.preventDefault();
        onSelectEvent(null);
        break;

      default:
        break;
    }
  }, [events, selectedEventId, onSelectEvent, onEditEvent, onDeleteEvent]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    selectedEventId,
  };
};
