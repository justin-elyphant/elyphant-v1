
import React from "react";
import { useDraggable } from "@dnd-kit/core";
import EventCard from "../EventCard";
import { ExtendedEventData } from "../types";

interface DraggableEventCardProps {
  event: ExtendedEventData;
  onSendGift: () => void;
  onToggleAutoGift: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onVerifyEvent: () => void;
  onClick: () => void;
}

const DraggableEventCard = ({
  event,
  onSendGift,
  onToggleAutoGift,
  onEdit,
  onDelete,
  onVerifyEvent,
  onClick,
}: DraggableEventCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: event.id,
    data: {
      type: 'event',
      event,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

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
        onDelete={onDelete}
        onVerifyEvent={onVerifyEvent}
        onClick={onClick}
      />
    </div>
  );
};

export default DraggableEventCard;
