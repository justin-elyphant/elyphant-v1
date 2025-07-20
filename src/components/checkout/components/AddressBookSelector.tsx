
import React from 'react';
import { useAddresses } from '@/hooks/profile/useAddresses';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AddressBookSelectorProps {
  onSelect: (address: any) => void;
  onClose: () => void;
}

const AddressBookSelector: React.FC<AddressBookSelectorProps> = ({
  onSelect,
  onClose
}) => {
  const { addresses, loading } = useAddresses();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!addresses || addresses.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No saved addresses</h3>
        <p className="text-muted-foreground mb-4">
          Add an address to your profile to see it here
        </p>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {addresses.map((address) => (
        <Card 
          key={address.id} 
          className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
          onClick={() => onSelect(address)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{address.name}</h4>
                {address.is_default && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Default
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>{address.address.street || address.address.address_line1}</p>
              <p>
                {address.address.city}, {address.address.state} {address.address.zipCode || address.address.zip_code}
              </p>
              <p>{address.address.country}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AddressBookSelector;
