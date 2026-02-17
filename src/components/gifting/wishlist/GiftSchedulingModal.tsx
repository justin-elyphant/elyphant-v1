import React, { useState } from "react";
import { Calendar, Gift, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WishlistItem } from "@/types/profile";
import { formatPrice } from "@/lib/utils";

interface GiftSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: WishlistItem[];
  onSchedule: (scheduleData: {
    items: WishlistItem[];
    scheduledDate: string;
    recipientEmail: string;
    recipientName: string;
    occasion: string;
    message: string;
    reminderDays: number;
  }) => void;
}

const GiftSchedulingModal = ({
  isOpen,
  onClose,
  items,
  onSchedule
}: GiftSchedulingModalProps) => {
  const [scheduledDate, setScheduledDate] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [occasion, setOccasion] = useState("");
  const [message, setMessage] = useState("");
  const [reminderDays, setReminderDays] = useState(7);

  const handleSubmit = () => {
    if (!scheduledDate || !recipientEmail || !recipientName) return;
    
    onSchedule({
      items,
      scheduledDate,
      recipientEmail,
      recipientName,
      occasion,
      message,
      reminderDays
    });
    
    // Reset form
    setScheduledDate("");
    setRecipientEmail("");
    setRecipientName("");
    setOccasion("");
    setMessage("");
    setReminderDays(7);
    onClose();
  };

  const totalValue = items.reduce((sum, item) => {
    return sum + (Number(item.price) || 0);
  }, 0);

  const isValid = scheduledDate && recipientEmail && recipientName;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Gift{items.length > 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Items Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Selected Items ({items.length})
                </h3>
                <Badge variant="secondary">
                  Total: ~{formatPrice(totalValue)}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                    <img
                      src={item.image_url || "/placeholder.svg"}
                      alt={item.name || "Product"}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">
                        {item.name || item.title || "Unknown Item"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Scheduling Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Delivery Date</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderDays">Reminder</Label>
              <Select value={reminderDays.toString()} onValueChange={(value) => setReminderDays(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day before</SelectItem>
                  <SelectItem value="3">3 days before</SelectItem>
                  <SelectItem value="7">1 week before</SelectItem>
                  <SelectItem value="14">2 weeks before</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient Name</Label>
              <Input
                id="recipientName"
                placeholder="Enter recipient's name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Recipient Email</Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="recipient@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="occasion">Occasion (Optional)</Label>
            <Select value={occasion} onValueChange={setOccasion}>
              <SelectTrigger>
                <SelectValue placeholder="Select an occasion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="birthday">Birthday</SelectItem>
                <SelectItem value="anniversary">Anniversary</SelectItem>
                <SelectItem value="graduation">Graduation</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
                <SelectItem value="thank-you">Thank You</SelectItem>
                <SelectItem value="just-because">Just Because</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to include with the gift..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValid}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Schedule Gift{items.length > 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GiftSchedulingModal;