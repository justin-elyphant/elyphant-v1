
import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import EventCard from "../EventCard";
import { ExtendedEventData } from "../types";

interface DraggableEventCardProps {
  event: ExtendedEventData;
  onSendGift: () => void;
  onToggleAutoGift: () => void;
  onEdit: () => void;
  onVerifyEvent: () => void;
  onClick?: () => void;
}

const DraggableEventCard = ({ 
  event, 
  onSendGift, 
  onToggleAutoGift, 
  onEdit, 
  onVerifyEvent, 
  onClick 
}: DraggableEventCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: event.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'z-50' : ''}`}
    >
      <EventCard
        event={event}
        onSendGift={onSendGift}
        onToggleAutoGift={onToggleAutoGift}
        onEdit={onEdit}
        onVerifyEvent={onVerifyEvent}
        onClick={onClick}
      />
    </div>
  );
};

export default DraggableEventCard;
