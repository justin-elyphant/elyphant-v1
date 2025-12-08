import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableCardProps {
  id: string;
  children: React.ReactNode;
  isEditing: boolean;
  className?: string;
}

export function DraggableCard({ id, children, isEditing, className }: DraggableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        isDragging && 'z-50 opacity-90 shadow-2xl scale-[1.02]',
        isEditing && 'ring-2 ring-primary/20 ring-offset-2 rounded-lg',
        className
      )}
    >
      {isEditing && (
        <button
          {...attributes}
          {...listeners}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-background border border-border rounded-md shadow-sm cursor-grab active:cursor-grabbing hover:bg-muted transition-colors"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
      {children}
    </div>
  );
}
