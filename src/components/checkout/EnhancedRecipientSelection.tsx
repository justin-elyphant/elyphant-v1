import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MapPin, Plus } from 'lucide-react';
import ConnectionRecipientSelector from '../connections/ConnectionRecipientSelector';
import AddressBookSelector from './AddressBookSelector';

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
          <TabsList className="grid w-full grid-cols-2">
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