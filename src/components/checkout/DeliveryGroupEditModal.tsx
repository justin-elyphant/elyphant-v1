import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, MapPin, User, Gift } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DeliveryGroup } from '@/types/recipient';

interface DeliveryGroupEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryGroup: DeliveryGroup;
  onSave: (updatedGroup: DeliveryGroup) => void;
}

const DeliveryGroupEditModal: React.FC<DeliveryGroupEditModalProps> = ({
  open,
  onOpenChange,
  deliveryGroup,
  onSave
}) => {
  const [editForm, setEditForm] = useState({
    giftMessage: deliveryGroup.giftMessage || '',
    scheduledDeliveryDate: deliveryGroup.scheduledDeliveryDate || '',
    shippingAddress: deliveryGroup.shippingAddress ? {
      name: deliveryGroup.shippingAddress.name || '',
      address: deliveryGroup.shippingAddress.address || '',
      city: deliveryGroup.shippingAddress.city || '',
      state: deliveryGroup.shippingAddress.state || '',
      zipCode: deliveryGroup.shippingAddress.zipCode || '',
      country: deliveryGroup.shippingAddress.country || 'United States'
    } : null
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    editForm.scheduledDeliveryDate ? new Date(editForm.scheduledDeliveryDate) : undefined
  );

  const handleSave = () => {
    const updatedGroup: DeliveryGroup = {
      ...deliveryGroup,
      giftMessage: editForm.giftMessage,
      scheduledDeliveryDate: selectedDate ? selectedDate.toISOString() : undefined,
      shippingAddress: editForm.shippingAddress
    };

    onSave(updatedGroup);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Delivery for {deliveryGroup.connectionName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Gift Message */}
          <div className="space-y-2">
            <Label htmlFor="giftMessage" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Gift Message
            </Label>
            <Textarea
              id="giftMessage"
              placeholder="Enter a personal gift message (optional)"
              value={editForm.giftMessage}
              onChange={(e) => setEditForm(prev => ({ ...prev, giftMessage: e.target.value }))}
              className="min-h-[80px]"
            />
          </div>

          {/* Scheduled Delivery Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Scheduled Delivery Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Shipping Address */}
          {editForm.shippingAddress && (
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </Label>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="addressName">Full Name</Label>
                  <Input
                    id="addressName"
                    value={editForm.shippingAddress.name}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      shippingAddress: prev.shippingAddress ? {
                        ...prev.shippingAddress,
                        name: e.target.value
                      } : null
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="addressStreet">Street Address</Label>
                  <Input
                    id="addressStreet"
                    value={editForm.shippingAddress.address}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      shippingAddress: prev.shippingAddress ? {
                        ...prev.shippingAddress,
                        address: e.target.value
                      } : null
                    }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="addressCity">City</Label>
                    <Input
                      id="addressCity"
                      value={editForm.shippingAddress.city}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        shippingAddress: prev.shippingAddress ? {
                          ...prev.shippingAddress,
                          city: e.target.value
                        } : null
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="addressState">State</Label>
                    <Input
                      id="addressState"
                      value={editForm.shippingAddress.state}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        shippingAddress: prev.shippingAddress ? {
                          ...prev.shippingAddress,
                          state: e.target.value
                        } : null
                      }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="addressZip">ZIP Code</Label>
                    <Input
                      id="addressZip"
                      value={editForm.shippingAddress.zipCode}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        shippingAddress: prev.shippingAddress ? {
                          ...prev.shippingAddress,
                          zipCode: e.target.value
                        } : null
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="addressCountry">Country</Label>
                    <Input
                      id="addressCountry"
                      value={editForm.shippingAddress.country}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        shippingAddress: prev.shippingAddress ? {
                          ...prev.shippingAddress,
                          country: e.target.value
                        } : null
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryGroupEditModal;