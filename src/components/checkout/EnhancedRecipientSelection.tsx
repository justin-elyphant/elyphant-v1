import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MapPin, Plus, UserPlus } from 'lucide-react';
import ConnectionRecipientSelector from '../connections/ConnectionRecipientSelector';
import AddressBookSelector from './AddressBookSelector';
import { RecipientInfoForm } from '@/components/marketplace/product-details/recipient-info/RecipientInfoForm';
import { pendingGiftsService } from '@/services/pendingGiftsService';
import { toast } from 'sonner';

interface RecipientData {
  id: string;
  name: string;
  address: any;
  email?: string;
  source: 'connection' | 'address_book' | 'manual';
}

interface EnhancedRecipientSelectionProps {
  onRecipientSelect: (recipient: RecipientData) => void;
  selectedRecipientId?: string;
  title?: string;
}

const EnhancedRecipientSelection: React.FC<EnhancedRecipientSelectionProps> = ({
  onRecipientSelect,
  selectedRecipientId,
  title = "Choose Recipient"
}) => {
  const [activeTab, setActiveTab] = useState('connections');
  const [isAddingRecipient, setIsAddingRecipient] = useState(false);

  const handleConnectionSelect = (recipient: any) => {
    onRecipientSelect({
      ...recipient,
      source: 'connection'
    });
  };

  const handleAddressSelect = (address: any) => {
    onRecipientSelect({
      id: address.id,
      name: address.name,
      address: address.address,
      source: 'address_book'
    });
  };

  const handleNewRecipientSubmit = async (data: any) => {
    try {
      setIsAddingRecipient(true);
      
      // Create pending connection using the service
      const pendingConnection = await pendingGiftsService.createPendingConnection(
        data.recipientEmail,
        `${data.recipientFirstName} ${data.recipientLastName}`,
        'friend', // Default relationship type
        {
          name: `${data.recipientFirstName} ${data.recipientLastName}`,
          address: data.recipientAddress,
          city: data.recipientCity,
          state: data.recipientState,
          zipCode: data.recipientZip,
          country: 'United States'
        }
      );

      // Create recipient data for immediate use
      const recipient: RecipientData = {
        id: pendingConnection.id,
        name: `${data.recipientFirstName} ${data.recipientLastName}`,
        email: data.recipientEmail,
        address: {
          name: `${data.recipientFirstName} ${data.recipientLastName}`,
          address: data.recipientAddress,
          city: data.recipientCity,
          state: data.recipientState,
          zipCode: data.recipientZip,
          country: 'United States'
        },
        source: 'manual'
      };

      onRecipientSelect(recipient);
      toast.success(`Recipient ${recipient.name} added successfully!`);
    } catch (error) {
      console.error('Error adding new recipient:', error);
      toast.error('Failed to add recipient. Please try again.');
    } finally {
      setIsAddingRecipient(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connections" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">My Connections</span>
              <span className="sm:hidden">Friends</span>
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Address Book</span>
              <span className="sm:hidden">Addresses</span>
            </TabsTrigger>
            <TabsTrigger value="new-recipient" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add New</span>
              <span className="sm:hidden">New</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="mt-4">
            <ConnectionRecipientSelector
              onRecipientSelect={handleConnectionSelect}
              selectedRecipientId={selectedRecipientId}
              title=""
              showAddressRequest={true}
            />
          </TabsContent>

          <TabsContent value="addresses" className="mt-4">
            <AddressBookSelector
              onAddressSelect={handleAddressSelect}
              selectedAddressId={selectedRecipientId}  
              title=""
              allowAddNew={true}
            />
          </TabsContent>

          <TabsContent value="new-recipient" className="mt-4">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Add a new recipient who will receive these items. They'll be added to your connections.
              </div>
              <RecipientInfoForm
                onSubmit={handleNewRecipientSubmit}
                onCancel={() => {}} // No cancel action needed in this context
                productName="Selected Items"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick action hint */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Pro tip:</strong> Connect with friends and family to enable one-click gift sending with saved addresses
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedRecipientSelection;