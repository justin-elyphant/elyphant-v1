import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Connection {
  id: string;
  connected_user_id: string;
  name: string;
  email?: string;
  relationship_type: string;
  profile_image?: string;
}

interface AddressRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: Connection | null;
  onRequestSent: () => void;
}

const AddressRequestDialog: React.FC<AddressRequestDialogProps> = ({
  open,
  onOpenChange,
  connection,
  onRequestSent
}) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [includeNotifications, setIncludeNotifications] = useState(true);
  const [reminderSchedule, setReminderSchedule] = useState('3_days');

  React.useEffect(() => {
    if (connection) {
      setEmail(connection.email || '');
      setMessage(
        `Hi ${connection.name}! I'd like to send you a gift for an upcoming occasion. ` +
        `Could you please share your shipping address? This will be kept private and ` +
        `only used for gift deliveries. Thanks!`
      );
    }
  }, [connection]);

  const handleSendRequest = async () => {
    if (!connection || !email.trim() || !message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSending(true);
    try {
      // This would call an edge function to:
      // 1. Create address request record
      // 2. Send email notification
      // 3. Set up reminder schedule
      
      const requestData = {
        recipient_id: connection.connected_user_id,
        recipient_email: email,
        message: message.trim(),
        include_notifications: includeNotifications,
        reminder_schedule: reminderSchedule,
        expires_in_days: 7
      };

      // Call orchestrator to send address request
      const { data, error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'address_request',
          customData: requestData
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to send address request');
      }
      
      toast.success(`Address request sent to ${connection.name}`);
      onRequestSent();
      onOpenChange(false);
      
      // Reset form
      setEmail('');
      setMessage('');
      setIncludeNotifications(true);
      setReminderSchedule('3_days');
    } catch (error) {
      console.error('Error sending address request:', error);
      toast.error('Failed to send address request');
    } finally {
      setSending(false);
    }
  };

  if (!connection) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Request Address from {connection.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connection Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {connection.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="font-medium">{connection.name}</div>
              <div className="text-sm text-muted-foreground capitalize">
                {connection.relationship_type}
              </div>
            </div>
            <Badge variant="outline">{connection.relationship_type}</Badge>
          </div>

          {/* Email Field */}
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="mt-1"
              required
            />
            {!connection.email && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                <AlertCircle className="h-4 w-4" />
                <span>Email not found in profile. Please enter manually.</span>
              </div>
            )}
          </div>

          {/* Message Field */}
          <div>
            <Label htmlFor="message">Personal Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a personal message explaining why you need their address"
              className="mt-1"
              rows={4}
              required
            />
            <div className="text-xs text-muted-foreground mt-1">
              Be specific about why you need their address to increase response rate
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Notification Settings</Label>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={includeNotifications}
                  onChange={(e) => setIncludeNotifications(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="notifications" className="text-sm">
                  Send email notifications
                </Label>
              </div>
              
              {includeNotifications && (
                <div className="ml-6 space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Reminder Schedule:
                  </Label>
                  <select
                    value={reminderSchedule}
                    onChange={(e) => setReminderSchedule(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="1_day">After 1 day</option>
                    <option value="3_days">After 3 days</option>
                    <option value="5_days">After 5 days</option>
                    <option value="no_reminders">No reminders</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Request Details */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Expires in 7 days</span>
            </div>
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <span>Email notification</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendRequest}
              disabled={sending || !email.trim() || !message.trim()}
              className="flex-1"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddressRequestDialog;