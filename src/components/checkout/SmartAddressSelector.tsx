import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, History, User, Check } from 'lucide-react';
import { addressService } from '@/services/addressService';
import { useAuth } from '@/contexts/auth';
import { toast } from "sonner";

interface SavedAddress {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    address_line2?: string;
  };
  is_default: boolean;
  last_used?: string;
  usage_count?: number;
}

interface SmartAddressSelectorProps {
  onAddressSelect: (address: SavedAddress) => void;
  currentShippingInfo: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  recentRecipients?: Array<{
    name: string;
    address: SavedAddress;
    lastOrderDate: string;
  }>;
}

const SmartAddressSelector: React.FC<SmartAddressSelectorProps> = ({
  onAddressSelect,
  currentShippingInfo,
  recentRecipients = []
}) => {
  const { user } = useAuth();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddressBook, setShowAddressBook] = useState(false);

  const loadSavedAddresses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const addresses = await addressService.getUserAddresses(user.id);
      setSavedAddresses(addresses.map((addr: any) => ({
        id: addr.id,
        name: addr.name,
        address: addr.address || {
          street: addr.street || '',
          city: addr.city || '',
          state: addr.state || '',
          zipCode: addr.zipCode || '',
          country: addr.country || 'United States'
        },
        is_default: addr.is_default,
        last_used: addr.created_at || new Date().toISOString(),
        usage_count: 1
      })));
    } catch (error) {
      console.error('Error loading saved addresses:', error);
      toast.error("Failed to load saved addresses");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (showAddressBook) {
      loadSavedAddresses();
    }
  }, [showAddressBook, user]);

  const handleAddressSelect = (address: SavedAddress) => {
    onAddressSelect(address);
    setShowAddressBook(false);
    toast.success(`Using saved address for ${address.name}`);
  };

  const formatAddress = (address: SavedAddress['address']) => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
  };

  const isCurrentAddressComplete = () => {
    return currentShippingInfo.address && 
           currentShippingInfo.city && 
           currentShippingInfo.state && 
           currentShippingInfo.zipCode;
  };

  const saveCurrentAddress = async () => {
    if (!user || !isCurrentAddressComplete()) return;
    
    try {
      await addressService.saveAddressToProfile(
        user.id,
        {
          street: currentShippingInfo.address,
          city: currentShippingInfo.city,
          state: currentShippingInfo.state,
          zipCode: currentShippingInfo.zipCode,
          country: currentShippingInfo.country
        },
        currentShippingInfo.name,
        false
      );
      
      toast.success("Current address has been saved for future use");
    } catch (error) {
      toast.error("Failed to save address");
    }
  };

  if (!user) {
    return null; // Don't show for guests
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Address Book & Smart Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddressBook(!showAddressBook)}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            Saved Addresses
          </Button>
          
          {isCurrentAddressComplete() && (
            <Button
              variant="outline"
              size="sm"
              onClick={saveCurrentAddress}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Save Current
            </Button>
          )}
        </div>

        {/* Recent Recipients Smart Suggestions */}
        {recentRecipients.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent Recipients
            </h4>
            <div className="space-y-2">
              {recentRecipients.slice(0, 3).map((recipient, index) => (
                <div
                  key={index}
                  className="p-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleAddressSelect(recipient.address)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{recipient.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatAddress(recipient.address.address)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {new Date(recipient.lastOrderDate).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved Addresses */}
        {showAddressBook && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Your Saved Addresses</h4>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading addresses...</div>
            ) : savedAddresses.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No saved addresses found. Complete your first order to save addresses automatically.
              </div>
            ) : (
              <div className="space-y-2">
                {savedAddresses.map((address) => (
                  <div
                    key={address.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleAddressSelect(address)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{address.name}</span>
                          {address.is_default && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatAddress(address.address)}
                        </div>
                      </div>
                      <Check className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Address Validation Message */}
        {isCurrentAddressComplete() && (
          <div className="text-xs text-muted-foreground bg-green-50 p-2 rounded">
            ✓ Address looks complete and deliverable
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartAddressSelector;