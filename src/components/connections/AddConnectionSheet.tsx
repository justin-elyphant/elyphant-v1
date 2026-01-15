import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { MobileBottomSheet } from "@/components/mobile/MobileBottomSheet";
import { Mail, ChevronDown, ChevronUp, MapPin, Calendar, Users, Send, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { unifiedRecipientService } from "@/services/unifiedRecipientService";
import { unifiedGiftManagementService } from "@/services/UnifiedGiftManagementService";
import { useInvitationAnalytics, invitationAnalyticsService } from "@/services/analytics/invitationAnalyticsService";
import { triggerHapticFeedback } from "@/utils/haptics";
import { useIsMobile } from "@/hooks/use-mobile";
import GooglePlacesAutocomplete from "@/components/forms/GooglePlacesAutocomplete";

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
  const isMobile = useIsMobile();
  const { trackInvitationSent } = useInvitationAnalytics();
  const [isLoading, setIsLoading] = useState(false);
  const [showAddressSection, setShowAddressSection] = useState(false);
  const [showRelationshipSection, setShowRelationshipSection] = useState(false);
  
  const [inviteForm, setInviteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    relationship: 'friend',
    customMessage: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    birthday: '',
    closenessLevel: 5,
    interactionFrequency: 'regular',
    specialConsiderations: '',
    sharedInterests: ''
  });

  const handleClose = () => {
    setInviteForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      relationship: 'friend',
      customMessage: '',
      address: '',
      address2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      birthday: '',
      closenessLevel: 5,
      interactionFrequency: 'regular',
      specialConsiderations: '',
      sharedInterests: ''
    });
    setShowAddressSection(false);
    setShowRelationshipSection(false);
    onClose();
  };

  const handleSendInvitation = async () => {
    if (!inviteForm.firstName || !inviteForm.email) {
      toast.error("Please provide at least first name and email");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to send invitations");
      return;
    }

    setIsLoading(true);
    triggerHapticFeedback('light');
    
    try {
      const fullName = `${inviteForm.firstName} ${inviteForm.lastName}`.trim();
      
      // Build shipping address if provided
      const shippingAddress = showAddressSection && inviteForm.address ? {
        firstName: inviteForm.firstName,
        lastName: inviteForm.lastName,
        address: inviteForm.address,
        address_line_2: inviteForm.address2,
        city: inviteForm.city,
        state: inviteForm.state,
        zipCode: inviteForm.zipCode,
        country: inviteForm.country,
        phone: inviteForm.phone
      } : undefined;

      // Build relationship context
      const relationshipContext = {
        closeness_level: inviteForm.closenessLevel,
        interaction_frequency: inviteForm.interactionFrequency,
        gift_giving_history: [],
        special_considerations: inviteForm.specialConsiderations ? [inviteForm.specialConsiderations] : [],
        relationship_duration: null,
        shared_interests: inviteForm.sharedInterests ? inviteForm.sharedInterests.split(',').map(i => i.trim()) : [],
        gift_preferences: {}
      };

      // Create pending connection with full details - returns row with invitation_token
      const pendingConnection = await unifiedGiftManagementService.createPendingConnection(
        inviteForm.email,
        fullName,
        inviteForm.relationship,
        shippingAddress,
        inviteForm.birthday || null,
        relationshipContext
      );

      // Extract invitation token from created connection
      const invitationToken = pendingConnection?.invitation_token;
      console.log('[AddConnectionSheet] Created pending connection with token:', invitationToken);

      // Build invitation URL with token for automatic connection linking
      const invitationUrl = invitationToken 
        ? `https://elyphant.ai/auth?invite=${invitationToken}`
        : 'https://elyphant.ai/auth';

      // Track invitation analytics
      await invitationAnalyticsService.trackInvitationSent({
        recipient_email: inviteForm.email,
        recipient_name: fullName,
        relationship_type: inviteForm.relationship,
        metadata: {
          source: 'add_connection_sheet',
          invitation_type: 'manual_connection',
          source_context: 'connections_page',
          has_address: !!shippingAddress,
          has_birthday: !!inviteForm.birthday
        }
      });

      // Send invitation email via orchestrator with standardized payload
      const { error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'connection_invitation',
          recipientEmail: inviteForm.email,
          data: {
            sender_name: user.user_metadata?.name || user.email || 'Someone',
            recipient_name: fullName,
            recipient_email: inviteForm.email,
            invitation_url: invitationUrl,
            custom_message: inviteForm.customMessage || `Hi ${inviteForm.firstName}! I'd love to connect with you on Elyphant so we can share wishlists and find perfect gifts for each other.`
          }
        }
      });

      if (error) {
        console.error('Error sending invitation email:', error);
        toast.warning(`Connection created but email failed to send. You can resend from the Pending tab.`);
      } else {
        toast.success(`Invitation sent to ${inviteForm.firstName}! They'll receive an email to join.`);
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
    <div className="space-y-4 p-4 max-h-[70vh] overflow-y-auto">
      <div className="text-center pb-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
          <UserPlus className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Invite Someone New</h3>
        <p className="text-muted-foreground text-sm">
          Send an invitation to join your network on Elyphant
        </p>
      </div>

      {/* Core Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="invite-firstName">First Name *</Label>
          <Input
            id="invite-firstName"
            placeholder="First name"
            value={inviteForm.firstName}
            onChange={(e) => setInviteForm(prev => ({ ...prev, firstName: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-lastName">Last Name</Label>
          <Input
            id="invite-lastName"
            placeholder="Last name"
            value={inviteForm.lastName}
            onChange={(e) => setInviteForm(prev => ({ ...prev, lastName: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="invite-email">Email Address *</Label>
        <Input
          id="invite-email"
          type="email"
          placeholder="their@email.com"
          value={inviteForm.email}
          onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
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
            <SelectItem value="partner">Partner</SelectItem>
            <SelectItem value="parent">Parent</SelectItem>
            <SelectItem value="child">Child</SelectItem>
            <SelectItem value="sibling">Sibling</SelectItem>
            <SelectItem value="cousin">Cousin</SelectItem>
            <SelectItem value="colleague">Colleague</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Birthday Field */}
      <div className="space-y-1.5">
        <Label htmlFor="invite-birthday" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Birthday (Optional)
        </Label>
        <Input
          id="invite-birthday"
          type="date"
          value={inviteForm.birthday}
          onChange={(e) => setInviteForm(prev => ({ ...prev, birthday: e.target.value }))}
        />
      </div>

      {/* Collapsible Address Section */}
      <Collapsible open={showAddressSection} onOpenChange={setShowAddressSection}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="outline" className="w-full flex items-center gap-2" size="sm">
            <MapPin className="h-4 w-4" />
            {showAddressSection ? "Hide Address Fields" : "Add Address (Optional)"}
            {showAddressSection ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-3">
          <div className="space-y-1.5">
            <GooglePlacesAutocomplete
              label="Street Address"
              placeholder="Start typing an address..."
              value={inviteForm.address}
              onChange={(value) => setInviteForm(prev => ({ ...prev, address: value }))}
              onAddressSelect={(address) => {
                setInviteForm(prev => ({
                  ...prev,
                  address: address.street,
                  city: address.city,
                  state: address.state,
                  zipCode: address.zipCode,
                  country: address.country
                }));
              }}
            />
          </div>
          <Input
            placeholder="Apt, Suite, Unit (optional)"
            value={inviteForm.address2}
            onChange={(e) => setInviteForm(prev => ({ ...prev, address2: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="City"
              value={inviteForm.city}
              onChange={(e) => setInviteForm(prev => ({ ...prev, city: e.target.value }))}
            />
            <Input
              placeholder="State"
              value={inviteForm.state}
              onChange={(e) => setInviteForm(prev => ({ ...prev, state: e.target.value }))}
            />
          </div>
          <Input
            placeholder="ZIP Code"
            value={inviteForm.zipCode}
            onChange={(e) => setInviteForm(prev => ({ ...prev, zipCode: e.target.value }))}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Collapsible Relationship Details Section */}
      <Collapsible open={showRelationshipSection} onOpenChange={setShowRelationshipSection}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="outline" className="w-full flex items-center gap-2" size="sm">
            <Users className="h-4 w-4" />
            {showRelationshipSection ? "Hide Relationship Details" : "Add Relationship Details (Optional)"}
            {showRelationshipSection ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-3">
          <div className="space-y-2">
            <Label>Closeness Level: {inviteForm.closenessLevel}/10</Label>
            <Slider
              min={1}
              max={10}
              step={1}
              value={[inviteForm.closenessLevel]}
              onValueChange={(value) => setInviteForm(prev => ({ ...prev, closenessLevel: value[0] }))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              1 = acquaintance, 10 = very close
            </p>
          </div>
          
          <div className="space-y-1.5">
            <Label>How often do you interact?</Label>
            <Select
              value={inviteForm.interactionFrequency}
              onValueChange={(value) => setInviteForm(prev => ({ ...prev, interactionFrequency: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="occasionally">Occasionally</SelectItem>
                <SelectItem value="rarely">Rarely</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Shared Interests</Label>
            <Input
              placeholder="e.g., books, cooking, sports, travel"
              value={inviteForm.sharedInterests}
              onChange={(e) => setInviteForm(prev => ({ ...prev, sharedInterests: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Special Considerations</Label>
            <Textarea
              placeholder="Any notes about gift preferences, allergies, etc."
              value={inviteForm.specialConsiderations}
              onChange={(e) => setInviteForm(prev => ({ ...prev, specialConsiderations: e.target.value }))}
              rows={2}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Personal Message */}
      <div className="space-y-1.5">
        <Label>Personal Message (Optional)</Label>
        <Textarea
          placeholder="Add a personal note to your invitation..."
          value={inviteForm.customMessage}
          onChange={(e) => setInviteForm(prev => ({ ...prev, customMessage: e.target.value }))}
          rows={2}
        />
      </div>

      {/* Info Box */}
      <div className="bg-muted/50 rounded-lg p-3 text-sm">
        <p className="font-medium mb-1">What they'll receive:</p>
        <ul className="text-muted-foreground space-y-0.5 text-xs">
          <li>• A personalized invitation from you</li>
          <li>• Link to create their Elyphant account</li>
          <li>• Instant connection to your network</li>
        </ul>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSendInvitation}
        disabled={isLoading || !inviteForm.firstName || !inviteForm.email}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
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

  // Use MobileBottomSheet on mobile, Dialog on desktop
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle>Invite Someone</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};
