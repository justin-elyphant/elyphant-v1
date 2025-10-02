import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserPlus } from 'lucide-react';
import GooglePlacesAutocomplete from '@/components/forms/GooglePlacesAutocomplete';
import { StandardizedAddress } from '@/services/googlePlacesService';
import { unifiedRecipientService, UnifiedRecipient } from '@/services/unifiedRecipientService';
import { toast } from 'sonner';

interface NewRecipientFormData {
  name: string;
  email: string;
  relationship_type: string;
  address?: {
    street: string;
    address_line2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  notes?: string;
}

interface NewRecipientFormProps {
  onRecipientCreate: (recipient: UnifiedRecipient) => void;
  onCancel: () => void;
  title?: string;
}

const NewRecipientForm: React.FC<NewRecipientFormProps> = ({
  onRecipientCreate,
  onCancel,
  title = "Add New Recipient"
}) => {
  const [formData, setFormData] = useState<NewRecipientFormData>({
    name: '',
    email: '',
    relationship_type: 'friend',
    address: {
      street: '',
      address_line2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    notes: ''
  });
  const [addressValue, setAddressValue] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState('');

  const relationshipTypes = [
    { value: 'friend', label: 'Friend' },
    { value: 'family', label: 'Family' },
    { value: 'colleague', label: 'Colleague' },
    { value: 'partner', label: 'Partner' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsCreating(true);
    setCreationProgress('Validating form data...');
    
    // Enhanced validation
    if (!formData.name.trim()) {
      toast.error('Please enter a recipient name');
      setIsCreating(false);
      setCreationProgress('');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      toast.error('Please enter a valid email address');
      setIsCreating(false);
      setCreationProgress('');
      return;
    }

    const address = formData.address;
    if (!address?.street?.trim() || !address?.city?.trim() || 
        !address?.state?.trim() || !address?.zipCode?.trim()) {
      toast.error('Please fill in all required address fields');
      setIsCreating(false);
      setCreationProgress('');
      return;
    }

    try {
      setCreationProgress('Creating recipient invitation...');
      
      const sanitizedData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        relationship_type: formData.relationship_type,
        address: {
          street: address.street.trim(),
          address_line2: address.address_line2?.trim() || '',
          city: address.city.trim(),
          state: address.state.trim(),
          zipCode: address.zipCode.trim(),
          country: address.country.trim()
        }
      };
      
      const newPendingRecipient = await unifiedRecipientService.createPendingRecipient(sanitizedData);
      
      const unifiedRecipient: UnifiedRecipient = {
        id: newPendingRecipient.id,
        name: sanitizedData.name,
        email: sanitizedData.email,
        address: sanitizedData.address,
        source: 'pending',
        relationship_type: sanitizedData.relationship_type,
        status: 'pending_invitation'
      };
      
      setCreationProgress('Finalizing...');
      onRecipientCreate(unifiedRecipient);
      toast.success('Invitation sent to recipient');
      
    } catch (error: any) {
      console.error('Failed to create recipient:', error);
      
      let userFriendlyMessage = 'Failed to create recipient. Please try again.';
      
      if (error?.message?.includes('duplicate') || error?.code === '23505') {
        userFriendlyMessage = 'A recipient with this email already exists.';
      } else if (error?.message?.includes('Authentication') || error?.message?.includes('session')) {
        userFriendlyMessage = 'Please sign in again to continue.';
      }
      
      toast.error(userFriendlyMessage);
    } finally {
      setIsCreating(false);
      setCreationProgress('');
    }
  };

  const handleAddressSelect = (standardizedAddress: StandardizedAddress) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address!,
        street: standardizedAddress.street,
        city: standardizedAddress.city,
        state: standardizedAddress.state,
        zipCode: standardizedAddress.zipCode,
        country: standardizedAddress.country
      }
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto max-h-[90vh] flex flex-col">
      <CardHeader className="sticky top-0 z-10 bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur border-b shrink-0 pt-5 pb-3">
        <CardTitle className="grid grid-cols-[auto_1fr_auto] items-center gap-2 leading-tight text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="-ml-2 justify-self-start"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="justify-self-center">{title}</span>
          <span className="justify-self-end w-5 h-5">
            <UserPlus className="h-5 w-5 mx-auto" />
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 pb-32 pt-6 overflow-y-auto ios-smooth-scroll">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter recipient's name"
                disabled={isCreating}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="recipient@example.com"
                disabled={isCreating}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="relationship">Relationship *</Label>
            <Select
              value={formData.relationship_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, relationship_type: value }))}
              disabled={isCreating}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Shipping Address *</Label>
            
            <GooglePlacesAutocomplete
              value={addressValue}
              onChange={setAddressValue}
              onAddressSelect={handleAddressSelect}
              placeholder="Search for an address..."
              disabled={isCreating}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  value={formData.address?.street || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address!, street: e.target.value }
                  }))}
                  placeholder="123 Main St"
                  disabled={isCreating}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="address_line2">Apartment/Unit</Label>
                <Input
                  id="address_line2"
                  value={formData.address?.address_line2 || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address!, address_line2: e.target.value }
                  }))}
                  placeholder="Apt 4B"
                  disabled={isCreating}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.address?.city || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address!, city: e.target.value }
                  }))}
                  placeholder="City"
                  disabled={isCreating}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.address?.state || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address!, state: e.target.value }
                  }))}
                  placeholder="CA"
                  disabled={isCreating}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={formData.address?.zipCode || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address!, zipCode: e.target.value }
                  }))}
                  placeholder="12345"
                  disabled={isCreating}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="country">Country *</Label>
                <Select
                  value={formData.address?.country || 'US'}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address!, country: value }
                  }))}
                  disabled={isCreating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any special notes about this recipient..."
              disabled={isCreating}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isCreating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{creationProgress || 'Creating...'}</span>
                </div>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewRecipientForm;