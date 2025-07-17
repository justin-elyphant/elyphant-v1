import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Connection, RelationshipType } from "@/types/connections";
import { unifiedRecipientService, UnifiedRecipient } from "@/services/unifiedRecipientService";
import { toast } from "sonner";
import GoogleAddressInput from "./GoogleAddressInput";

interface PendingConnectionEditModalProps {
  connection: Connection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const relationshipOptions: { value: RelationshipType; label: string }[] = [
  { value: 'friend', label: 'Friend' },
  { value: 'colleague', label: 'Colleague' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'custom', label: 'Custom' },
];

const PendingConnectionEditModal: React.FC<PendingConnectionEditModalProps> = ({
  connection,
  open,
  onOpenChange,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [recipientData, setRecipientData] = useState<UnifiedRecipient | null>(null);
  const [googleAddressValue, setGoogleAddressValue] = useState('');
  const [formData, setFormData] = useState({
    name: connection.name || '',
    email: connection.recipientEmail || '',
    relationship_type: connection.relationship || 'friend',
    address: {
      street: '',
      address_line_2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    }
  });

  // Load full recipient data when modal opens
  useEffect(() => {
    if (open && connection.id) {
      const loadRecipientData = async () => {
        try {
          const recipient = await unifiedRecipientService.getRecipientById(connection.id);
          console.log('🔍 Loaded recipient data:', recipient);
          
          if (recipient) {
            setRecipientData(recipient);
            const newFormData = {
              name: recipient.name || '',
              email: recipient.email || '',
              relationship_type: (recipient.relationship_type as RelationshipType) || 'friend',
              address: {
                street: recipient.address?.street || '',
                address_line_2: recipient.address?.address_line_2 || '',
                city: recipient.address?.city || '',
                state: recipient.address?.state || '',
                zipCode: recipient.address?.zipCode || '',
                country: recipient.address?.country || 'US'
              }
            };
            console.log('🔍 Setting form data:', newFormData);
            setFormData(newFormData);
          }
        } catch (error) {
          console.error('Error loading recipient data:', error);
        }
      };
      loadRecipientData();
    }
  }, [open, connection.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await unifiedRecipientService.updatePendingConnection(connection.id, {
        name: formData.name,
        email: formData.email,
        relationship_type: formData.relationship_type,
        address: formData.address
      });

      toast.success('Connection updated successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating connection:', error);
      toast.error('Failed to update connection');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleGoogleAddressSelect = (address: any) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        ...address
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Pending Connection</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship</Label>
            <Select
              value={formData.relationship_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, relationship_type: value as RelationshipType }))}
            >
              <SelectTrigger>
                <SelectValue>{relationshipOptions.find(opt => opt.value === formData.relationship_type)?.label || 'Select relationship'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {relationshipOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  placeholder="123 Main St"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line_2">Apartment, Suite, etc. (Optional)</Label>
                <Input
                  id="address_line_2"
                  value={formData.address.address_line_2}
                  onChange={(e) => handleAddressChange('address_line_2', e.target.value)}
                  placeholder="Apt 4B, Suite 200, etc."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.address.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    placeholder="New York"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.address.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    placeholder="NY"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.address.zipCode}
                    onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                    placeholder="10001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={formData.address.country}
                  onValueChange={(value) => handleAddressChange('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Connection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PendingConnectionEditModal;