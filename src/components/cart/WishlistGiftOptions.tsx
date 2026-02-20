import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Calendar, ChevronDown, ChevronUp, Check } from "lucide-react";
import { CartItem } from "@/contexts/CartContext";
import { formatScheduledDate } from "@/utils/dateUtils";
import { triggerHapticFeedback } from "@/utils/haptics";

interface WishlistGiftOptionsProps {
  item: CartItem;
  updateRecipientAssignment: (productId: string, updates: any) => void;
}

const WishlistGiftOptions = ({ item, updateRecipientAssignment }: WishlistGiftOptionsProps) => {
  const [expanded, setExpanded] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [draftNote, setDraftNote] = useState(item.recipientAssignment?.giftMessage || "");
  const [draftDate, setDraftDate] = useState(item.recipientAssignment?.scheduledDeliveryDate || "");

  const hasNote = !!item.recipientAssignment?.giftMessage;
  const hasDate = !!item.recipientAssignment?.scheduledDeliveryDate;

  const today = new Date();
  today.setDate(today.getDate() + 1);
  const minDate = today.toISOString().split("T")[0];

  const saveNote = () => {
    updateRecipientAssignment(item.product.product_id, { giftMessage: draftNote.trim() });
    setEditingNote(false);
    triggerHapticFeedback("success");
  };

  const saveDate = (value: string) => {
    setDraftDate(value);
    updateRecipientAssignment(item.product.product_id, { scheduledDeliveryDate: value });
    triggerHapticFeedback("success");
  };

  return (
    <div className="space-y-2 mt-1">
      {/* Recipient row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">→</span>
          <span className="font-medium text-foreground">{item.wishlist_owner_name}</span>
          <span className="text-xs text-muted-foreground">· from wishlist</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          {expanded ? (
            <>Less <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>+ Add note / date <ChevronDown className="h-3 w-3" /></>
          )}
        </button>
      </div>

      {/* Previews when collapsed */}
      {!expanded && (hasNote || hasDate) && (
        <div className="space-y-1 ml-4">
          {hasNote && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Gift className="h-3 w-3 flex-shrink-0" />
              <span className="truncate italic">"{item.recipientAssignment!.giftMessage}"</span>
            </div>
          )}
          {hasDate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span>{formatScheduledDate(item.recipientAssignment!.scheduledDeliveryDate!)}</span>
            </div>
          )}
        </div>
      )}

      {/* Expanded options */}
      {expanded && (
        <div className="ml-4 space-y-3 border-l-2 border-border/50 pl-3 pt-1">
          {/* Gift note */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Gift className="h-3 w-3" />
              Gift Note
            </label>
            {editingNote ? (
              <div className="space-y-1.5">
                <Textarea
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value.slice(0, 240))}
                  placeholder="Write a personal message for Justin..."
                  className="text-sm resize-none min-h-[72px]"
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{draftNote.length}/240</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => {
                        setDraftNote(item.recipientAssignment?.giftMessage || "");
                        setEditingNote(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" className="h-7 text-xs" onClick={saveNote}>
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditingNote(true)}
                className="w-full text-left text-sm border border-dashed border-border rounded-md px-3 py-2 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
              >
                {hasNote ? (
                  <span className="italic text-foreground">"{item.recipientAssignment!.giftMessage}"</span>
                ) : (
                  "Tap to add a personal note…"
                )}
              </button>
            )}
          </div>

          {/* Schedule date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              Delivery Date <span className="text-muted-foreground/60 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              min={minDate}
              value={draftDate}
              onChange={(e) => saveDate(e.target.value)}
              className="w-full text-sm border border-input rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {hasDate && (
              <p className="text-xs text-muted-foreground">
                Scheduled for {formatScheduledDate(item.recipientAssignment!.scheduledDeliveryDate!)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistGiftOptions;
