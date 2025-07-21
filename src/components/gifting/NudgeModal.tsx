
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Mail, Gift, Users } from "lucide-react";
import { sendConnectionNudge } from "@/services/search/connectionRequestService";
import { toast } from "sonner";

interface NudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  recipientName: string;
  onComplete?: () => void;
  connectionType?: 'gift_invitation' | 'connection_request';
  connectionId?: string;
}

const NudgeModal: React.FC<NudgeModalProps> = ({
  isOpen,
  onClose,
  recipientEmail,
  recipientName,
  onComplete,
  connectionType = 'gift_invitation',
  connectionId
}) => {
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendNudge = async () => {
    if (!connectionId && connectionType === 'connection_request') {
      toast.error('Connection ID is required for connection request nudges');
      return;
    }

    setSending(true);
    try {
      if (connectionType === 'connection_request' && connectionId) {
        const result = await sendConnectionNudge(connectionId, customMessage);
        if (!result.success) {
          throw new Error(result.error || 'Failed to send nudge');
        }
      } else {
        // Handle gift invitation nudges (existing logic)
        toast.info('Gift invitation nudges not yet implemented');
      }

      toast.success('Reminder sent successfully!');
      onComplete?.();
      onClose();
    } catch (error) {
      console.error('Error sending nudge:', error);
      toast.error('Failed to send reminder');
    } finally {
      setSending(false);
    }
  };

  const getModalContent = () => {
    if (connectionType === 'connection_request') {
      return {
        icon: <Users className="h-6 w-6 text-blue-600" />,
        title: "Send Connection Reminder",
        description: `Send a friendly reminder to ${recipientName} about your pending connection request.`,
        defaultMessage: `Hi ${recipientName}! I sent you a connection request and wanted to follow up. I'd love to connect with you on the platform. Thanks!`,
        buttonText: "Send Reminder"
      };
    } else {
      return {
        icon: <Gift className="h-6 w-6 text-purple-600" />,
        title: "Send Gift Invitation Reminder", 
        description: `Send a reminder to ${recipientName} about your gift invitation.`,
        defaultMessage: `Hi ${recipientName}! I sent you a gift invitation and wanted to follow up. I'd love to share some gift ideas with you. Thanks!`,
        buttonText: "Send Invitation Reminder"
      };
    }
  };

  const content = getModalContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {content.icon}
            {content.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <p className="font-medium">{recipientName}</p>
                  <p className="text-sm text-muted-foreground">{recipientEmail}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="message">
              {content.description}
            </Label>
            <Textarea
              id="message"
              placeholder={content.defaultMessage}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSendNudge} 
              disabled={sending}
              className="flex-1"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : content.buttonText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NudgeModal;
