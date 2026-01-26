import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RelationshipSelector from '@/components/shared/RelationshipSelector';
import { Users, UserPlus, X } from 'lucide-react';
import { UnifiedRecipient, unifiedRecipientService } from '@/services/unifiedRecipientService';
import GooglePlacesAutocomplete from '@/components/forms/GooglePlacesAutocomplete';
import { StandardizedAddress } from '@/services/googlePlacesService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';
import StateSelect from '@/components/profile-setup/steps/shipping-address/StateSelect';
import InlineAddressVerification from '@/components/profile-setup/InlineAddressVerification';
import { SimpleRecipientSelector, SelectedRecipient } from '@/components/marketplace/product-details/SimpleRecipientSelector';
import { useProfile } from '@/hooks/profile/useProfile';
import { triggerHapticFeedback } from '@/utils/haptics';

interface UnifiedRecipientSelectionProps {
  onRecipientSelect: (recipient: UnifiedRecipient) => void;
  onClose: () => void;
  title?: string;
  selectedRecipientId?: string;
}

interface NewRecipientForm {
  name: string;
  email: string;
  relationship_type: string;
  knowAddress: boolean;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  } | null;
}

const UnifiedRecipientSelection: React.FC<UnifiedRecipientSelectionProps> = ({
  onRecipientSelect,
  onClose,
  title = "Select Recipient",
  selectedRecipientId
}) => {
  const [showNewRecipientForm, setShowNewRecipientForm] = useState(false);
  const [newRecipientForm, setNewRecipientForm] = useState<NewRecipientForm>({
    name: '',
    email: '',
    relationship_type: 'friend',
    knowAddress: false,
    phone: '',
    address: null
  });
  const [isCreatingRecipient, setIsCreatingRecipient] = useState(false);
  const [creationProgress, setCreationProgress] = useState('');
  const [addressVerified, setAddressVerified] = useState(false);
  const { user } = useAuth();
  const { profile } = useProfile();

  // Convert selectedRecipientId to SelectedRecipient value for SimpleRecipientSelector
  const currentValue: SelectedRecipient | null = selectedRecipientId ? {
    type: selectedRecipientId === 'self' ? 'self' : 'connection',
    connectionId: selectedRecipientId
  } : null;

  // Handle Google Places address selection for new recipient form
  const handleGooglePlacesSelect = (standardizedAddress: StandardizedAddress) => {
    setNewRecipientForm(prev => ({
      ...prev,
      address: {
        street: standardizedAddress.street,
        city: standardizedAddress.city,
        state: standardizedAddress.state,
        zipCode: standardizedAddress.zipCode,
        country: standardizedAddress.country
      }
    }));
  };

  // Convert SimpleRecipientSelector's SelectedRecipient to UnifiedRecipient
  const handleSelectorChange = (selected: SelectedRecipient) => {
    triggerHapticFeedback('light');
    
    if (selected.type === 'self') {
      const unifiedRecipient: UnifiedRecipient = {
        id: 'self',
        name: profile?.name || user?.user_metadata?.name || 'Myself',
        email: user?.email || '',
        source: 'connection',
        status: 'accepted',
        address: selected.shippingAddress ? {
          name: selected.shippingAddress.name,
          address: selected.shippingAddress.address,
          city: selected.shippingAddress.city,
          state: selected.shippingAddress.state,
          zipCode: selected.shippingAddress.zipCode,
          country: selected.shippingAddress.country,
          phone: selected.shippingAddress.phone
        } : null
      };
      onRecipientSelect(unifiedRecipient);
    } else if (selected.type === 'connection' && selected.connectionId) {
      const unifiedRecipient: UnifiedRecipient = {
        id: selected.connectionId,
        name: selected.connectionName || 'Recipient',
        source: 'connection',
        status: selected.addressVerified ? 'accepted' : 'pending_invitation',
        address: selected.shippingAddress ? {
          name: selected.shippingAddress.name,
          address: selected.shippingAddress.address,
          city: selected.shippingAddress.city,
          state: selected.shippingAddress.state,
          zipCode: selected.shippingAddress.zipCode,
          country: selected.shippingAddress.country,
          phone: selected.shippingAddress.phone
        } : null
      };
      onRecipientSelect(unifiedRecipient);
    }
    // For 'later' type, just close the modal without selecting
  };

  // Handle invite new from SimpleRecipientSelector
  const handleInviteNew = (name: string, email: string) => {
    setNewRecipientForm(prev => ({ ...prev, name, email }));
    setShowNewRecipientForm(true);
  };

  const handleNewRecipientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 [RECIPIENT_CREATION] Starting recipient creation process');
    setIsCreatingRecipient(true);
    setCreationProgress('Validating form data...');
    
    // Enhanced validation
    if (!newRecipientForm.name.trim()) {
      toast.error('Please enter a recipient name');
      setIsCreatingRecipient(false);
      setCreationProgress('');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newRecipientForm.email.trim() || !emailRegex.test(newRecipientForm.email.trim())) {
      toast.error('Please enter a valid email address');
      setIsCreatingRecipient(false);
      setCreationProgress('');
      return;
    }

    setCreationProgress('Sending invitation...');

    try {
      const sanitizedData = {
        name: newRecipientForm.name.trim(),
        email: newRecipientForm.email.trim().toLowerCase(),
        relationship_type: newRecipientForm.relationship_type,
        pending_shipping_address: newRecipientForm.knowAddress && newRecipientForm.address ? {
          street: newRecipientForm.address.street,
          city: newRecipientForm.address.city,
          state: newRecipientForm.address.state,
          zipCode: newRecipientForm.address.zipCode,
          country: newRecipientForm.address.country || 'US',
          phone: newRecipientForm.phone
        } : null
      };
      
      setCreationProgress('Creating recipient invitation...');
      
      const newPendingRecipient = await unifiedRecipientService.createPendingRecipient(sanitizedData);
      
      const recipientAddress = newRecipientForm.knowAddress && newRecipientForm.address ? {
        name: sanitizedData.name,
        address: newRecipientForm.address.street,
        city: newRecipientForm.address.city,
        state: newRecipientForm.address.state,
        zipCode: newRecipientForm.address.zipCode,
        country: newRecipientForm.address.country || 'US',
        phone: newRecipientForm.phone
      } : null;
      
      const unifiedRecipient: UnifiedRecipient = {
        id: newPendingRecipient.id,
        name: sanitizedData.name,
        email: sanitizedData.email,
        source: 'pending',
        relationship_type: sanitizedData.relationship_type,
        status: 'pending_invitation',
        address: recipientAddress
      };
      
      triggerHapticFeedback('success');
      onRecipientSelect(unifiedRecipient);
      
      const successMessage = newRecipientForm.knowAddress && recipientAddress 
        ? `Gift ready! ${sanitizedData.name}'s address is confirmed.`
        : `Invitation sent! ${sanitizedData.name} will provide their address during signup.`;
      toast.success(successMessage);
      
      setShowNewRecipientForm(false);
      resetNewRecipientForm();
      
    } catch (error: any) {
      console.error('💥 [ERROR] Failed to create recipient:', error);
      
      let userFriendlyMessage = 'Failed to create recipient. Please try again.';
      if (error?.message?.includes('duplicate') || error?.code === '23505') {
        userFriendlyMessage = 'A recipient with this email already exists.';
      } else if (error?.message?.includes('Authentication') || error?.message?.includes('session')) {
        userFriendlyMessage = 'Please sign in again to continue.';
      }
      
      toast.error(userFriendlyMessage);
    } finally {
      setIsCreatingRecipient(false);
      setCreationProgress('');
    }
  };

  const resetNewRecipientForm = () => {
    setNewRecipientForm({
      name: '',
      email: '',
      relationship_type: 'friend',
      knowAddress: false,
      phone: '',
      address: null
    });
    setAddressVerified(false);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {!showNewRecipientForm ? (
          <div className="space-y-4">
            {/* SimpleRecipientSelector - unified component */}
            <SimpleRecipientSelector
              value={currentValue}
              onChange={handleSelectorChange}
              userAddress={profile?.shipping_address}
              userName={profile?.name || user?.user_metadata?.name || 'Myself'}
              onInviteNew={handleInviteNew}
            />
            
            {/* Cancel button */}
            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={onClose} className="min-h-[44px]">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          /* New Recipient Form - preserved from original */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                <h3 className="font-medium">Add New Recipient</h3>
              </div>
              {isCreatingRecipient && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">{creationProgress}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleNewRecipientSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newRecipientForm.name}
                    onChange={(e) => setNewRecipientForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter recipient's name"
                    className="min-h-[44px]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship</Label>
                  <RelationshipSelector
                    value={newRecipientForm.relationship_type}
                    onValueChange={(value) => setNewRecipientForm(prev => ({ ...prev, relationship_type: value }))}
                  />
                </div>
              </div>

              {/* Email (required) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newRecipientForm.email}
                  onChange={(e) => setNewRecipientForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  className="min-h-[44px]"
                  required
                />
              </div>

              {/* "Know Their Address?" Toggle */}
              <div className="space-y-4 border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="know-address" className="text-sm font-medium">
                      Do you know their shipping address?
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {newRecipientForm.knowAddress 
                        ? "Gift can ship immediately" 
                        : "They'll provide it during signup"}
                    </p>
                  </div>
                  <Switch
                    id="know-address"
                    checked={newRecipientForm.knowAddress}
                    onCheckedChange={(checked) => {
                      triggerHapticFeedback('light');
                      setNewRecipientForm(prev => ({ 
                        ...prev, 
                        knowAddress: checked,
                        address: checked ? prev.address : null,
                        phone: checked ? prev.phone : ''
                      }));
                      setAddressVerified(false);
                    }}
                  />
                </div>

                {/* Address Form (shown when knowAddress is true) */}
                {newRecipientForm.knowAddress && (
                  <div className="space-y-4 pt-4 border-t">
                    <GooglePlacesAutocomplete
                      value={newRecipientForm.address?.street || ''}
                      onChange={(value) => setNewRecipientForm(prev => ({
                        ...prev,
                        address: { ...prev.address!, street: value }
                      }))}
                      onAddressSelect={handleGooglePlacesSelect}
                      label="Street Address *"
                      placeholder="Start typing their address..."
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="recipient-city">City *</Label>
                        <Input
                          id="recipient-city"
                          value={newRecipientForm.address?.city || ''}
                          onChange={(e) => setNewRecipientForm(prev => ({
                            ...prev,
                            address: { ...prev.address!, city: e.target.value }
                          }))}
                          placeholder="City"
                          className="min-h-[44px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recipient-state">State *</Label>
                        <StateSelect
                          value={newRecipientForm.address?.state || ''}
                          onChange={(state) => setNewRecipientForm(prev => ({
                            ...prev,
                            address: { ...prev.address!, state }
                          }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="recipient-zip">Zip Code *</Label>
                        <Input
                          id="recipient-zip"
                          value={newRecipientForm.address?.zipCode || ''}
                          onChange={(e) => setNewRecipientForm(prev => ({
                            ...prev,
                            address: { ...prev.address!, zipCode: e.target.value }
                          }))}
                          placeholder="Zip Code"
                          className="min-h-[44px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recipient-phone">Phone *</Label>
                        <Input
                          id="recipient-phone"
                          type="tel"
                          value={newRecipientForm.phone}
                          onChange={(e) => setNewRecipientForm(prev => ({
                            ...prev,
                            phone: e.target.value
                          }))}
                          placeholder="(555) 123-4567"
                          className="min-h-[44px]"
                        />
                      </div>
                    </div>

                    {/* Address Verification Badge */}
                    {newRecipientForm.address?.street && newRecipientForm.address?.city && 
                     newRecipientForm.address?.state && newRecipientForm.address?.zipCode && (
                      <InlineAddressVerification
                        address={{
                          street: newRecipientForm.address.street,
                          city: newRecipientForm.address.city,
                          state: newRecipientForm.address.state,
                          zipCode: newRecipientForm.address.zipCode,
                          country: newRecipientForm.address.country || 'US'
                        }}
                        onVerificationChange={(isVerified) => setAddressVerified(isVerified)}
                      />
                    )}
                  </div>
                )}

                {/* Info badge when NOT providing address */}
                {!newRecipientForm.knowAddress && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">
                      <span className="text-purple-600">📦</span> <strong>{newRecipientForm.name || 'The recipient'}</strong> will provide their shipping address when they sign up.
                    </p>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  type="submit" 
                  className="flex-1 min-h-[44px] bg-gradient-to-r from-purple-600 to-sky-500 text-white hover:from-purple-700 hover:to-sky-600"
                  disabled={isCreatingRecipient}
                >
                  {isCreatingRecipient ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </div>
                  ) : (
                    'Send Invitation'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    triggerHapticFeedback('light');
                    setShowNewRecipientForm(false);
                    resetNewRecipientForm();
                  }}
                  disabled={isCreatingRecipient}
                  className="min-h-[44px]"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedRecipientSelection;
