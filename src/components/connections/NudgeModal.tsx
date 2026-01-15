import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Connection } from "@/types/connections";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Send, MessageSquare, Phone } from "lucide-react";

interface NudgeModalProps {
  connection: Connection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const NudgeModal: React.FC<NudgeModalProps> = ({
  connection,
  open,
  onOpenChange,
  onSuccess
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [nudgeMethod, setNudgeMethod] = useState<'email' | 'sms' | 'both'>('email');
  const [customMessage, setCustomMessage] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('friendly');
  const [userProfile, setUserProfile] = useState<{ name?: string; first_name?: string; last_name?: string } | null>(null);

  // Fetch user profile to get name
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, first_name, last_name')
          .eq('id', user.id)
          .single();
        
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  const messageTemplates = {
    friendly: `Hi ${connection.name}! 👋\n\nI sent you a gift invitation earlier and wanted to follow up. I'm excited to connect with you on our gifting platform!\n\nWould you like to join and see what I have in mind for you?`,
    urgent: `Hi ${connection.name},\n\nI hope you're doing well! I sent you a gift invitation a while back and wanted to make sure you didn't miss it.\n\nIt would mean a lot to me if you could take a moment to check it out.`,
    casual: `Hey ${connection.name}! 😊\n\nJust wanted to follow up on the gift invitation I sent your way. No pressure, but I think you'd really enjoy what I have planned!\n\nLet me know if you have any questions!`,
    custom: customMessage
  };

  const handleSendNudge = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Send nudge via orchestrator
      const { error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'nudge_reminder',
          recipientEmail: connection.recipientEmail,
          data: {
            recipientEmail: connection.recipientEmail,
            recipientName: connection.name,
            senderName: userProfile?.name || userProfile?.first_name || 'Your friend',
            customMessage: messageTemplate === 'custom' ? customMessage : messageTemplates[messageTemplate],
            invitationUrl: window.location.origin + '/signup'
          }
        }
      });

      if (error) {
        throw error;
      }

      toast.success("Reminder sent!", {
        description: `Successfully sent a reminder to ${connection.name} via ${nudgeMethod}.`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending nudge:', error);
      toast.error("Failed to send reminder", {
        description: "There was an error sending the reminder. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Reminder to {connection.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Send via</Label>
            <RadioGroup value={nudgeMethod} onValueChange={(value) => setNudgeMethod(value as typeof nudgeMethod)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sms" id="sms" />
                <Label htmlFor="sms" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  SMS (if available)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both">Both Email & SMS</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-sm font-medium">Message Template</Label>
            <RadioGroup value={messageTemplate} onValueChange={setMessageTemplate}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="friendly" id="friendly" />
                <Label htmlFor="friendly">Friendly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="urgent" id="urgent" />
                <Label htmlFor="urgent">Gentle Reminder</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="casual" id="casual" />
                <Label htmlFor="casual">Casual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom">Custom Message</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-sm font-medium">Preview</Label>
            <div className="border rounded-md p-3 bg-muted/50 text-sm">
              {messageTemplate === 'custom' ? (
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Write your custom message here..."
                  className="min-h-[100px] resize-none"
                />
              ) : (
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {messageTemplates[messageTemplate]}
                </p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You can send up to 3 reminders per connection, with at least 1 week between each reminder.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendNudge} 
            disabled={loading || (messageTemplate === 'custom' && !customMessage.trim())}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Reminder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NudgeModal;