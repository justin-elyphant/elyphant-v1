import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Calendar, Check, X, Pencil } from "lucide-react";
import { CartItem } from "@/contexts/CartContext";
import { formatScheduledDate } from "@/utils/dateUtils";
import { triggerHapticFeedback } from "@/utils/haptics";

interface WishlistGiftOptionsProps {
  item: CartItem;
  updateRecipientAssignment: (productId: string, updates: any) => void;
}

const WishlistGiftOptions = ({ item, updateRecipientAssignment }: WishlistGiftOptionsProps) => {
  const [editingNote, setEditingNote] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
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

  const cancelNote = () => {
    setDraftNote(item.recipientAssignment?.giftMessage || "");
    setEditingNote(false);
  };

  const saveDate = () => {
    updateRecipientAssignment(item.product.product_id, { scheduledDeliveryDate: draftDate });
    setEditingDate(false);
    triggerHapticFeedback("success");
  };

  const clearDate = () => {
    setDraftDate("");
    updateRecipientAssignment(item.product.product_id, { scheduledDeliveryDate: "" });
    setEditingDate(false);
  };

  const recipientFirstName = item.wishlist_owner_name?.split(" ")[0] || "them";

  return (
    <div className="space-y-2 mt-2">
      {/* Recipient label */}
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground">→</span>
        <span className="font-semibold text-foreground">{item.wishlist_owner_name}</span>
        <span className="text-xs text-muted-foreground">· from wishlist</span>
      </div>

      {/* Action buttons row */}
      {!editingNote && !editingDate && (
        <div className="flex gap-2">
          {/* Gift Note button */}
          <button
            onClick={() => { setEditingNote(true); triggerHapticFeedback("light"); }}
            className={`flex-1 flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors
              ${hasNote
                ? "border-primary/30 bg-primary/5 text-foreground"
                : "border-dashed border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/40 hover:text-foreground"
              }`}
          >
            <Gift className="h-3.5 w-3.5 flex-shrink-0 text-primary/70" />
            <div className="min-w-0 flex-1">
              {hasNote ? (
                <>
                  <p className="text-xs font-medium text-primary/80 leading-none mb-0.5">Gift note</p>
                  <p className="text-xs truncate italic text-foreground/80">"{item.recipientAssignment!.giftMessage}"</p>
                </>
              ) : (
                <p className="text-xs font-medium">Add gift note</p>
              )}
            </div>
            <Pencil className="h-3 w-3 flex-shrink-0 opacity-40" />
          </button>

          {/* Schedule Date button */}
          <button
            onClick={() => { setEditingDate(true); triggerHapticFeedback("light"); }}
            className={`flex-1 flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors
              ${hasDate
                ? "border-primary/30 bg-primary/5 text-foreground"
                : "border-dashed border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/40 hover:text-foreground"
              }`}
          >
            <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-primary/70" />
            <div className="min-w-0 flex-1">
              {hasDate ? (
                <>
                  <p className="text-xs font-medium text-primary/80 leading-none mb-0.5">Scheduled</p>
                  <p className="text-xs truncate text-foreground/80">
                    {new Date(item.recipientAssignment!.scheduledDeliveryDate! + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </>
              ) : (
                <p className="text-xs font-medium">Schedule delivery</p>
              )}
            </div>
            <Pencil className="h-3 w-3 flex-shrink-0 opacity-40" />
          </button>
        </div>
      )}

      {/* Inline note editor */}
      {editingNote && (
        <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5 text-primary/70" />
            Gift note for {recipientFirstName}
          </p>
          <Textarea
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value.slice(0, 240))}
            placeholder={`Write a personal message for ${recipientFirstName}…`}
            className="text-sm resize-none min-h-[80px]"
            autoFocus
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{draftNote.length}/240</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelNote}>
                <X className="h-3 w-3 mr-1" />Cancel
              </Button>
              <Button size="sm" className="h-7 text-xs" onClick={saveNote}>
                <Check className="h-3 w-3 mr-1" />Save note
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Inline date editor */}
      {editingDate && (
        <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary/70" />
            Schedule delivery date
          </p>
          <input
            type="date"
            min={minDate}
            value={draftDate}
            onChange={(e) => setDraftDate(e.target.value)}
            className="w-full text-sm border border-input rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">Payment will be held and processed 7 days before delivery.</p>
          <div className="flex items-center justify-between">
            {hasDate && (
              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={clearDate}>
                Remove date
              </Button>
            )}
            <div className={`flex gap-2 ${!hasDate ? "ml-auto" : ""}`}>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setDraftDate(item.recipientAssignment?.scheduledDeliveryDate || ""); setEditingDate(false); }}>
                <X className="h-3 w-3 mr-1" />Cancel
              </Button>
              <Button size="sm" className="h-7 text-xs" onClick={saveDate} disabled={!draftDate}>
                <Check className="h-3 w-3 mr-1" />Save date
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistGiftOptions;
