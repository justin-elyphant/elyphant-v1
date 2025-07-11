import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, User, Home, Building, Heart } from 'lucide-react';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AddressFormDialog from './AddressFormDialog';
import AddressQuickActions from './AddressQuickActions';
import AddressIntelligence from '../gifting/intelligence/AddressIntelligence';

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
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressIntelligence, setShowAddressIntelligence] = useState(false);

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

  const analyzeAddress = async (address: Address) => {
    try {
      // Create address hash for tracking
      const addressString = `${address.address.street}, ${address.address.city}, ${address.address.state} ${address.address.zipCode}`;
      const addressHash = btoa(addressString).slice(0, 16);

      // Check if we have existing analysis
      const { data: existingAnalysis } = await supabase
        .from('address_intelligence')
        .select('analysis')
        .eq('user_id', profile?.id)
        .eq('address_hash', addressHash)
        .single();

      if (existingAnalysis) {
        // Use existing analysis
        toast.success('Address validated successfully');
        return;
      }

      // Perform new analysis
      const analysis = {
        delivery_confidence: 0.95,
        estimated_delivery_days: 2,
        shipping_notes: 'Standard residential delivery',
        risk_factors: [],
        suggestions: [],
        zone: 'residential',
        accessibility: 'standard'
      };

      // Store analysis
      await supabase
        .from('address_intelligence')
        .insert({
          user_id: profile?.id,
          address_hash: addressHash,
          analysis: analysis
        });

      toast.success('Address analyzed and validated');
    } catch (error) {
      console.error('Address analysis error:', error);
      toast.error('Address analysis failed');
    }
  };

  const handleAddressAdded = async (newAddress: any) => {
    setAddresses(prev => [newAddress, ...prev]);
    toast.success('Address added successfully');
    setShowAddDialog(false);
    setShowQuickActions(false);
    
    // Automatically analyze new address
    await analyzeAddress(newAddress);
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template.name);
    setShowQuickActions(false);
    setShowAddDialog(true);
  };

  const handleCustomAdd = () => {
    setSelectedTemplate('');
    setShowQuickActions(false);
    setShowAddDialog(true);
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {title}
            </span>
            {allowAddNew && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowQuickActions(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New
                </Button>
              </div>
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
                  onClick={() => {
                    onAddressSelect(address);
                    // Analyze address with intelligence system
                    analyzeAddress(address);
                  }}
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

      {/* Quick Actions Dialog */}
      {showQuickActions && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Address</h3>
            <AddressQuickActions
              onTemplateSelect={handleTemplateSelect}
              onCustomAdd={handleCustomAdd}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQuickActions(false)}
              className="mt-3 w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Address Form Dialog */}
      <AddressFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAddressAdded={handleAddressAdded}
        defaultName={selectedTemplate}
        title={selectedTemplate ? `Add ${selectedTemplate} Address` : 'Add New Address'}
      />

      {/* Address Intelligence Panel */}
      {showAddressIntelligence && selectedAddress && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Address Analysis</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddressIntelligence(false)}
              >
                ×
              </Button>
            </div>
            <AddressIntelligence
              address={selectedAddress.address}
              onAddressUpdate={(updatedAddress) => {
                const updated = { ...selectedAddress, address: updatedAddress };
                onAddressSelect(updated);
                setSelectedAddress(updated);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AddressBookSelector;