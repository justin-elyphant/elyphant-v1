
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Reply, Heart, Copy, Pin, Archive, Trash2 } from "lucide-react";
import { Message } from "@/utils/messageService";

interface MessageContextMenuProps {
  message: Message;
  isOwn: boolean;
  onReply: (message: Message) => void;
  onReact: (messageId: string, emoji: string) => void;
  onCopy: (content: string) => void;
  onPin: (messageId: string) => void;
  onArchive: (messageId: string) => void;
  onDelete: (messageId: string) => void;
}

const MessageContextMenu = ({
  message,
  isOwn,
  onReply,
  onReact,
  onCopy,
  onPin,
  onArchive,
  onDelete
}: MessageContextMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onReply(message)}>
          <Reply className="h-4 w-4 mr-2" />
          Reply
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onReact(message.id, "❤️")}>
          <Heart className="h-4 w-4 mr-2" />
          React
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onCopy(message.content)}>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onPin(message.id)}>
          <Pin className="h-4 w-4 mr-2" />
          Pin Message
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onArchive(message.id)}>
          <Archive className="h-4 w-4 mr-2" />
          Archive
        </DropdownMenuItem>
        {isOwn && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(message.id)} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MessageContextMenu;
