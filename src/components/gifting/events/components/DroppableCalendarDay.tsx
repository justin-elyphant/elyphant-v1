
import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { format } from "date-fns";

interface DroppableCalendarDayProps {
  date: Date;
  children: React.ReactNode;
  onDrop?: (eventId: string, newDate: Date) => void;
}

const DroppableCalendarDay = ({ date, children, onDrop }: DroppableCalendarDayProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: format(date, 'yyyy-MM-dd'),
  });

  const style = {
    backgroundColor: isOver ? 'rgba(59, 130, 246, 0.1)' : undefined,
    border: isOver ? '2px dashed rgb(59, 130, 246)' : 'transparent',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="min-h-[100px] p-2 rounded transition-colors"
    >
      {children}
    </div>
  );
};

export default DroppableCalendarDay;
