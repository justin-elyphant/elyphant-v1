import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, User, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

interface AddressRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: {
    id: string;
    name: string;
    email?: string;
  };
}

const AddressRequestDialog: React.FC<AddressRequestDialogProps> = ({
  open,
  onOpenChange,
  recipient
}) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to send address requests');
      return;
    }

    if (!recipient.email) {
      toast.error('Recipient email is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create address request in database
      const { data: requestData, error: requestError } = await supabase
        .from('address_requests')
        .insert({
          requester_id: user.id,
          recipient_id: recipient.id,
          recipient_email: recipient.email,
          message: message || `Hi ${recipient.name}, I'd like to send you a gift! Could you please share your shipping address?`,
          status: 'pending'
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Construct the request URL for the email CTA
      const requestUrl = `https://elyphant.ai/address/provide/${requestData.id}`;

      // Send email notification via orchestrator
      const { error: emailError } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'address_request',
          customData: {
            requester_name: user.user_metadata?.name || user.email || 'Someone',
            requester_email: user.email,
            recipient_name: recipient.name,
            recipient_email: recipient.email,
            message: message,
            request_id: requestData.id,
            request_url: requestUrl
          }
        }
      });

      if (emailError) {
        console.warn('Email notification failed:', emailError);
        toast.warning('Address request saved, but email notification failed to send');
      } else {
        toast.success(`Address request sent to ${recipient.name}`);
      }

      setMessage('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating address request:', error);
      toast.error('Failed to send address request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Request Address from {recipient.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium">{recipient.name}</div>
              {recipient.email && (
                <div className="text-sm text-muted-foreground">{recipient.email}</div>
              )}
            </div>
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {recipient.name} will receive an email request to share their shipping address with you.
              They can approve or decline this request.
            </AlertDescription>
          </Alert>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder={`Hi ${recipient.name}, I'd like to send you a gift! Could you please share your shipping address?`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Add a personal touch to your address request
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !recipient.email}
          >
            {isSubmitting ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddressRequestDialog;
