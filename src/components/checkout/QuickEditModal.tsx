import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Edit, Save, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface QuickEditModalProps {
  type: 'address' | 'message';
  deliveryGroupId?: string;
  currentData?: any;
  onSave: (data: any) => void;
  children: React.ReactNode;
}

const QuickEditModal: React.FC<QuickEditModalProps> = ({
  type,
  deliveryGroupId,
  currentData,
  onSave,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(currentData || {});
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(formData);
      setIsOpen(false);
      toast.success(`${type === 'address' ? 'Address' : 'Message'} updated successfully`);
    } catch (error) {
      toast.error(`Failed to update ${type}`);
      console.error(`Error updating ${type}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'address' ? <MapPin className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            Quick Edit {type === 'address' ? 'Address' : 'Gift Message'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {type === 'address' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Recipient Name</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter recipient name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Enter street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state || ''}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="State"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode || ''}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  placeholder="Zip code"
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="message">Gift Message</Label>
              <Textarea
                id="message"
                value={formData.message || ''}
                onChange={(e) => handleChange('message', e.target.value)}
                placeholder="Enter a personalized gift message..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.message?.length || 0}/500 characters
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-1" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickEditModal;