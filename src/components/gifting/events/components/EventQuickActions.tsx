
import React from "react";
import { Button } from "@/components/ui/button";
import { ExtendedEventData } from "../types";
import { Edit, Trash2, Gift, Star, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

interface EventQuickActionsProps {
  event: ExtendedEventData;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSendGift?: (id: string) => void;
  onToggleAutoGift?: (id: string) => void;
  onVerifyEvent?: (id: string) => void;
  onMarkPriority?: (id: string) => void;
  compact?: boolean;
}

const EventQuickActions = ({
  event,
  onEdit,
  onDelete,
  onSendGift,
  onToggleAutoGift,
  onVerifyEvent,
  onMarkPriority,
  compact = false
}: EventQuickActionsProps) => {
  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {onEdit && (
            <DropdownMenuItem onClick={() => onEdit(event.id)}>
              <Edit className="h-3 w-3 mr-2" />
              Edit
            </DropdownMenuItem>
          )}
          {onSendGift && (
            <DropdownMenuItem onClick={() => onSendGift(event.id)}>
              <Gift className="h-3 w-3 mr-2" />
              Send Gift
            </DropdownMenuItem>
          )}
          {onToggleAutoGift && (
            <DropdownMenuItem onClick={() => onToggleAutoGift(event.id)}>
              <Star className="h-3 w-3 mr-2" />
              {event.autoGiftEnabled ? 'Disable Auto-Gift' : 'Enable Auto-Gift'}
            </DropdownMenuItem>
          )}
          {onVerifyEvent && !event.isVerified && (
            <DropdownMenuItem onClick={() => onVerifyEvent(event.id)}>
              <Check className="h-3 w-3 mr-2" />
              Mark Verified
            </DropdownMenuItem>
          )}
          {onMarkPriority && (
            <DropdownMenuItem onClick={() => onMarkPriority(event.id)}>
              <Star className="h-3 w-3 mr-2" />
              Mark Priority
            </DropdownMenuItem>
          )}
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(event.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex space-x-1">
      {onEdit && (
        <Button variant="ghost" size="sm" onClick={() => onEdit(event.id)}>
          <Edit className="h-3 w-3" />
        </Button>
      )}
      {onSendGift && (
        <Button variant="ghost" size="sm" onClick={() => onSendGift(event.id)}>
          <Gift className="h-3 w-3" />
        </Button>
      )}
      {onToggleAutoGift && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onToggleAutoGift(event.id)}
          className={event.autoGiftEnabled ? "text-green-600" : ""}
        >
          <Star className="h-3 w-3" />
        </Button>
      )}
      {onDelete && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onDelete(event.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

export default EventQuickActions;
