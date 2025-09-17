import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MobileBottomSheet } from "@/components/mobile/MobileBottomSheet";
import EnhancedConnectionSearch from "./EnhancedConnectionSearch";
import { Search, UserPlus, Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { unifiedRecipientService } from "@/services/unifiedRecipientService";
import { useInvitationAnalytics } from "@/services/analytics/invitationAnalyticsService";
import { triggerHapticFeedback } from "@/utils/haptics";

interface AddConnectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionAdded?: () => void;
}

type ViewState = 'main' | 'search' | 'invite';

export const AddConnectionSheet: React.FC<AddConnectionSheetProps> = ({
  isOpen,
  onClose,
  onConnectionAdded
}) => {
  const { user } = useAuth();
  const { trackInvitationSent } = useInvitationAnalytics();
  const [currentView, setCurrentView] = useState<ViewState>('main');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    relationship: 'friend'
  });

  const handleClose = () => {
    setCurrentView('main');
    setInviteForm({ name: '', email: '', relationship: 'friend' });
    onClose();
  };

  const handleViewChange = (view: ViewState) => {
    triggerHapticFeedback('selection');
    setCurrentView(view);
  };

  const handleSendInvitation = async () => {
    if (!inviteForm.name || !inviteForm.email) {
      toast.error("Please provide both name and email");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to send invitations");
      return;
    }

    setIsLoading(true);
    
    try {
      // Create pending recipient
      const pendingConnection = await unifiedRecipientService.createPendingRecipient({
        name: inviteForm.name,
        email: inviteForm.email,
        relationship_type: inviteForm.relationship
      });

      // Track invitation analytics
      await trackInvitationSent({
        recipient_email: inviteForm.email,
        recipient_name: inviteForm.name,
        relationship_type: inviteForm.relationship,
        metadata: {
          source: 'add_connection_fab',
          invitation_type: 'manual_connection',
          source_context: 'connections_page'
        }
      });

      // Send invitation email
      const { error } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          recipientEmail: inviteForm.email,
          recipientName: inviteForm.name,
          inviterName: user.user_metadata?.name || user.email || 'Someone',
          relationship: inviteForm.relationship,
          invitationType: 'connection'
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to send invitation email');
      }

      toast.success(`Invitation sent to ${inviteForm.name}! They'll be added to your connections when they join.`);
      
      // Reset form and close
      setInviteForm({ name: '', email: '', relationship: 'friend' });
      onConnectionAdded?.();
      handleClose();
      
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error("Failed to send invitation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderMainView = () => (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Add Connection</h3>
        <p className="text-muted-foreground text-sm">
          Connect with friends already on Elyphant or invite someone new
        </p>
      </div>

      <div className="space-y-3">
        <Button
          variant="outline"
          size="lg"
          className="w-full h-14 justify-start"
          onClick={() => handleViewChange('search')}
        >
          <Search className="h-5 w-5 mr-3" />
          <div className="text-left">
            <div className="font-medium">Search Existing Users</div>
            <div className="text-sm text-muted-foreground">Find friends already on Elyphant</div>
          </div>
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-full h-14 justify-start"
          onClick={() => handleViewChange('invite')}
        >
          <UserPlus className="h-5 w-5 mr-3" />
          <div className="text-left">
            <div className="font-medium">Invite Someone New</div>
            <div className="text-sm text-muted-foreground">Send an invitation to join your network</div>
          </div>
        </Button>
      </div>
    </div>
  );

  const renderSearchView = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 pb-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewChange('main')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h3 className="text-lg font-semibold">Search Users</h3>
          <p className="text-sm text-muted-foreground">Find friends already on Elyphant</p>
        </div>
      </div>
      
      <div className="px-4">
        <EnhancedConnectionSearch />
      </div>
    </div>
  );

  const renderInviteView = () => (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewChange('main')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h3 className="text-lg font-semibold">Invite Someone New</h3>
          <p className="text-sm text-muted-foreground">They'll receive an invitation to join your network</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invite-name">Name</Label>
          <Input
            id="invite-name"
            placeholder="Enter their name"
            value={inviteForm.name}
            onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="invite-email">Email Address</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="their@email.com"
            value={inviteForm.email}
            onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="invite-relationship">Relationship</Label>
          <Select 
            value={inviteForm.relationship} 
            onValueChange={(value) => setInviteForm(prev => ({ ...prev, relationship: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="friend">Friend</SelectItem>
              <SelectItem value="spouse">Spouse</SelectItem>
              <SelectItem value="cousin">Cousin</SelectItem>
              <SelectItem value="child">Child</SelectItem>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="sibling">Sibling</SelectItem>
              <SelectItem value="colleague">Colleague</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <div className="text-sm space-y-2">
          <p className="font-medium">What they'll receive:</p>
          <ul className="text-muted-foreground space-y-1">
            <li>• A personalized invitation from you</li>
            <li>• Link to create their Elyphant account</li>
            <li>• Instant connection to your network</li>
            <li>• Access to wishlist and gift features</li>
          </ul>
        </div>
      </div>

      <Button
        onClick={handleSendInvitation}
        disabled={isLoading || !inviteForm.name || !inviteForm.email}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Sending Invitation...
          </>
        ) : (
          <>
            <Mail className="w-4 h-4 mr-2" />
            Send Invitation
          </>
        )}
      </Button>
    </div>
  );

  const getSheetTitle = () => {
    switch (currentView) {
      case 'search': return 'Search Users';
      case 'invite': return 'Invite Someone';
      default: return 'Add Connection';
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'search': return renderSearchView();
      case 'invite': return renderInviteView();
      default: return renderMainView();
    }
  };

  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={getSheetTitle()}
    >
      {renderCurrentView()}
    </MobileBottomSheet>
  );
};