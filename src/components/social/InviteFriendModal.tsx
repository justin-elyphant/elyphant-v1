import React, { useState } from "react";
import { UserPlus, Mail, User, Heart, Send, Phone, MapPin, ChevronDown, ChevronUp, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import GooglePlacesAutocomplete from "@/components/forms/GooglePlacesAutocomplete";
import { unifiedGiftManagementService } from "@/services/UnifiedGiftManagementService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// 🚨 MIGRATION NOTICE: Now using UnifiedGiftManagementService instead of pendingGiftsService

interface InviteFriendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const InviteFriendModal = ({ open, onOpenChange, trigger }: InviteFriendModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddressSection, setShowAddressSection] = useState(false);
  const [showRelationshipSection, setShowRelationshipSection] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    relationshipType: "friend",
    customMessage: "",
    address: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    birthday: "",
    closenessLevel: 5,
    interactionFrequency: "regular",
    specialConsiderations: "",
    sharedInterests: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const shippingAddress = showAddressSection && formData.address ? {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        address_line_2: formData.address2,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        phone: formData.phone
      } : undefined;

      // Create relationship context object
      const relationshipContext = {
        closeness_level: formData.closenessLevel,
        interaction_frequency: formData.interactionFrequency,
        gift_giving_history: [],
        special_considerations: formData.specialConsiderations ? [formData.specialConsiderations] : [],
        relationship_duration: null,
        shared_interests: formData.sharedInterests ? formData.sharedInterests.split(',').map(i => i.trim()) : [],
        gift_preferences: {}
      };

      // Create the pending connection in database
      await unifiedGiftManagementService.createPendingConnection(
        formData.email,
        fullName,
        formData.relationshipType,
        shippingAddress,
        formData.birthday || null,
        relationshipContext
      );

      // Send invitation email via orchestrator
      const { error: emailError } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'connection_invitation',
          customData: {
            recipientEmail: formData.email,
            recipientName: fullName,
            senderName: 'You',
            relationship: formData.relationshipType,
            customMessage: formData.customMessage || `Hi ${formData.firstName}! I'd love to connect with you on Elyphant so we can share wishlists and find perfect gifts for each other.`,
            invitationType: 'manual_connection'
          }
        }
      });

      if (emailError) {
        console.error('Error sending invitation email:', emailError);
        toast.warning(`Connection created but email failed to send. You can resend from the Pending tab.`);
      } else {
        toast.success(`Invitation sent to ${formData.firstName}! They'll receive an email to join and build their wishlist.`);
      }
      
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        relationshipType: "friend",
        customMessage: "",
        address: "",
        address2: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US",
        birthday: "",
        closenessLevel: 5,
        interactionFrequency: "regular",
        specialConsiderations: "",
        sharedInterests: ""
      });
      setShowAddressSection(false);
      setShowRelationshipSection(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Invite a Friend
          </DialogTitle>
          <DialogDescription>
            Invite someone to join and build their wishlist so you can find them perfect gifts
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                First Name *
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="First name"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Last name"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter their email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number (Optional)
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter their phone number"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Relationship
            </Label>
            <Select
              value={formData.relationshipType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, relationshipType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="family">Family Member</SelectItem>
                <SelectItem value="colleague">Colleague</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Collapsible open={showAddressSection} onOpenChange={setShowAddressSection}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {showAddressSection ? "Hide Address Fields" : "Add Address (Optional)"}
                {showAddressSection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <GooglePlacesAutocomplete
                  label="Street Address"
                  placeholder="Start typing an address..."
                  value={formData.address}
                  onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                  onAddressSelect={(address) => {
                    setFormData(prev => ({
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
              <div className="space-y-2">
                <Label htmlFor="address2">Address Line 2</Label>
                <Input
                  id="address2"
                  type="text"
                  placeholder="Apartment, Suite, Unit, etc. (optional)"
                  value={formData.address2}
                  onChange={(e) => setFormData(prev => ({ ...prev, address2: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    type="text"
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  type="text"
                  placeholder="ZIP Code"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="space-y-2">
            <Label htmlFor="birthday" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Birthday (Optional)
            </Label>
            <Input
              id="birthday"
              type="date"
              value={formData.birthday}
              onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
            />
          </div>

          <Collapsible open={showRelationshipSection} onOpenChange={setShowRelationshipSection}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full flex items-center gap-2">
                <Users className="h-4 w-4" />
                {showRelationshipSection ? "Hide Relationship Details" : "Add Relationship Details (Optional)"}
                {showRelationshipSection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="closenessLevel">
                  Closeness Level: {formData.closenessLevel}/10
                </Label>
                <Slider
                  id="closenessLevel"
                  min={1}
                  max={10}
                  step={1}
                  value={[formData.closenessLevel]}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, closenessLevel: value[0] }))}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  How close are you? (1 = acquaintance, 10 = very close)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interactionFrequency">How often do you interact?</Label>
                <Select
                  value={formData.interactionFrequency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, interactionFrequency: value }))}
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

              <div className="space-y-2">
                <Label htmlFor="sharedInterests">Shared Interests</Label>
                <Input
                  id="sharedInterests"
                  type="text"
                  placeholder="e.g., books, cooking, sports, travel"
                  value={formData.sharedInterests}
                  onChange={(e) => setFormData(prev => ({ ...prev, sharedInterests: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialConsiderations">Special Considerations</Label>
                <Textarea
                  id="specialConsiderations"
                  placeholder="Any special notes about gift preferences, allergies, or considerations..."
                  value={formData.specialConsiderations}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialConsiderations: e.target.value }))}
                  rows={2}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Personal Message (Optional)
            </Label>
            <Textarea
              id="message"
              placeholder="Add a personal note to your invitation..."
              value={formData.customMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteFriendModal;