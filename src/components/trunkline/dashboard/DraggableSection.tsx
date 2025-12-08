import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableSectionProps {
  id: string;
  children: React.ReactNode;
  isEditing: boolean;
  title?: string;
}

export function DraggableSection({ id, children, isEditing, title }: DraggableSectionProps) {
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
        isDragging && 'z-50 opacity-90 shadow-2xl',
        isEditing && 'p-3 -mx-3 rounded-xl bg-muted/30 border-2 border-dashed border-primary/30'
      )}
    >
      {isEditing && (
        <div className="flex items-center gap-2 mb-3">
          <button
            {...attributes}
            {...listeners}
            className="p-1.5 bg-background border border-border rounded-md shadow-sm cursor-grab active:cursor-grabbing hover:bg-muted transition-colors"
            aria-label="Drag to reorder section"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          {title && (
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
