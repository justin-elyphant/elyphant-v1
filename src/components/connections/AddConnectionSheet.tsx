import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MobileBottomSheet } from "@/components/mobile/MobileBottomSheet";
import { Send, UserPlus, Link2, Check } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { unifiedGiftManagementService } from "@/services/UnifiedGiftManagementService";
import { invitationAnalyticsService } from "@/services/analytics/invitationAnalyticsService";
import { triggerHapticFeedback } from "@/utils/haptics";
import { useIsMobile } from "@/hooks/use-mobile";

interface AddConnectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionAdded?: () => void;
}

export const AddConnectionSheet: React.FC<AddConnectionSheetProps> = ({
  isOpen,
  onClose,
  onConnectionAdded
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile(1024);
  const [isLoading, setIsLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleClose = () => {
    setInviteForm({ name: '', email: '', message: '' });
    setLinkCopied(false);
    onClose();
  };

  const handleCopyInviteLink = async () => {
    const username = user?.user_metadata?.username || user?.id;
    const link = `${window.location.origin}/invite/${username}`;
    await navigator.clipboard.writeText(link);
    setLinkCopied(true);
    triggerHapticFeedback('success');
    toast.success("Invite link copied!");
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const handleSendInvitation = async () => {
    if (!inviteForm.name || !inviteForm.email) {
      toast.error("Please provide a name and email");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to send invitations");
      return;
    }

    setIsLoading(true);
    triggerHapticFeedback('light');

    try {
      // Create pending connection — relationship details collected later
      const pendingConnection = await unifiedGiftManagementService.createPendingConnection(
        inviteForm.email,
        inviteForm.name,
        'friend',
        undefined,
        null,
        undefined
      );

      const invitationToken = pendingConnection?.invitation_token;

      const invitationUrl = invitationToken
        ? `https://elyphant.ai/auth?invite=${invitationToken}`
        : 'https://elyphant.ai/auth';

      // Track analytics
      await invitationAnalyticsService.trackInvitationSent({
        recipient_email: inviteForm.email,
        recipient_name: inviteForm.name,
        relationship_type: 'friend',
        metadata: {
          source: 'add_connection_sheet',
          invitation_type: 'manual_connection',
          source_context: 'connections_page'
        }
      });

      // Send invitation email
      const { error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'connection_invitation',
          recipientEmail: inviteForm.email,
          data: {
            sender_name: user.user_metadata?.name || user.email || 'Someone',
            recipient_name: inviteForm.name,
            recipient_email: inviteForm.email,
            invitation_url: invitationUrl,
            custom_message: inviteForm.message || `Hi ${inviteForm.name}! I'd love to connect with you on Elyphant so we can share wishlists and find perfect gifts for each other.`
          }
        }
      });

      if (error) {
        console.error('Error sending invitation email:', error);
        toast.warning("Connection created but email failed to send.");
      } else {
        toast.success(`Invitation sent to ${inviteForm.name}!`);
      }

      triggerHapticFeedback('success');
      onConnectionAdded?.();
      handleClose();

    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error("Failed to send invitation. Please try again.");
      triggerHapticFeedback('error');
    } finally {
      setIsLoading(false);
    }
  };

  const formContent = (
    <div className="space-y-4 p-4 pb-safe touch-action-manipulation overscroll-contain">
      <div className="text-center pb-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
          <UserPlus className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Invite Someone New</h3>
        <p className="text-muted-foreground text-sm">
          Send an invitation to join your gifting network
        </p>
      </div>

      {/* Share link button */}
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center gap-2"
        onClick={handleCopyInviteLink}
      >
        {linkCopied ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            Link Copied!
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4" />
            Copy My Invite Link
          </>
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or send by email</span>
        </div>
      </div>

      {/* 3 fields: name, email, message */}
      <div className="space-y-1.5">
        <Label htmlFor="invite-name">Name *</Label>
        <Input
          id="invite-name"
          placeholder="Their name"
          value={inviteForm.name}
          onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
          className="min-h-[44px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="invite-email">Email *</Label>
        <Input
          id="invite-email"
          type="email"
          placeholder="their@email.com"
          value={inviteForm.email}
          onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
          className="min-h-[44px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="invite-message">Personal Message (Optional)</Label>
        <Textarea
          id="invite-message"
          placeholder="Add a personal note..."
          value={inviteForm.message}
          onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
          rows={2}
        />
      </div>

      {/* Info */}
      <div className="bg-muted/50 rounded-lg p-3 text-sm">
        <p className="font-medium mb-1">What they'll receive:</p>
        <ul className="text-muted-foreground space-y-0.5 text-xs">
          <li>• A personalized invitation from you</li>
          <li>• Link to create their Elyphant account</li>
          <li>• Instant connection to your network</li>
        </ul>
      </div>

      <Button
        onClick={handleSendInvitation}
        disabled={isLoading || !inviteForm.name || !inviteForm.email}
        className="w-full min-h-[44px] active:scale-[0.97] transition-transform"
        size="lg"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Send Invitation
          </>
        )}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <MobileBottomSheet
        isOpen={isOpen}
        onClose={handleClose}
        title="Invite Someone"
      >
        {formContent}
      </MobileBottomSheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto overscroll-contain p-0">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle>Invite Someone</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};
