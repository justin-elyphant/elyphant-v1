
import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { UnifiedMessage } from "@/services/UnifiedMessagingService";

interface ReplyPreviewProps {
  replyingTo: UnifiedMessage;
  onCancel: () => void;
}

const ReplyPreview = ({ replyingTo, onCancel }: ReplyPreviewProps) => {
  return (
    <div className="p-3 border-t bg-muted/30">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-4 bg-primary rounded-full" />
            <span className="text-sm font-medium text-muted-foreground">
              Replying to message
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {replyingTo.content}
          </p>
        </div>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ReplyPreview;
