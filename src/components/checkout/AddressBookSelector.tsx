import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Plus, User, Home, Building, Heart } from 'lucide-react';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Address {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  is_default: boolean;
  user_id: string;
}

interface AddressBookSelectorProps {
  onAddressSelect: (address: Address) => void;
  selectedAddressId?: string;
  title?: string;
  allowAddNew?: boolean;
}

const AddressBookSelector: React.FC<AddressBookSelectorProps> = ({
  onAddressSelect,
  selectedAddressId,
  title = "Choose Delivery Address",
  allowAddNew = true
}) => {
  const { profile } = useProfile();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, [profile]);

  const fetchAddresses = async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', profile.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load saved addresses');
    } finally {
      setLoading(false);
    }
  };

  const getAddressIcon = (addressName: string) => {
    const name = addressName.toLowerCase();
    if (name.includes('home')) return <Home className="h-4 w-4" />;
    if (name.includes('work') || name.includes('office')) return <Building className="h-4 w-4" />;
    if (name.includes('family') || name.includes('parent')) return <Heart className="h-4 w-4" />;
    return <MapPin className="h-4 w-4" />;
  };

  const formatAddress = (address: Address['address']) => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Loading saved addresses...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {title}
          </span>
          {allowAddNew && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Address</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-muted-foreground">
                    Address form would be implemented here using ProfileContext
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {addresses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No saved addresses yet</p>
            <p className="text-sm">Add your first address to speed up checkout</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                  selectedAddressId === address.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => onAddressSelect(address)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getAddressIcon(address.name)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{address.name}</span>
                        {address.is_default && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatAddress(address.address)}
                      </p>
                    </div>
                  </div>
                  {selectedAddressId === address.id && (
                    <div className="text-primary">
                      <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AddressBookSelector;