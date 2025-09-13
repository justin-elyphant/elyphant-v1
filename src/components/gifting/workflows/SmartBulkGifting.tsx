import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Users, Gift, Calendar, MessageSquare, Wand2, CheckCircle, AlertCircle } from 'lucide-react';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import TemplateManager from '../templates/TemplateManager';
import AddressIntelligence from '../intelligence/AddressIntelligence';

interface Connection {
  id: string;
  connected_user_id: string;
  name: string;
  email?: string;
  profile_image?: string;
  relationship_type: string;
  has_address: boolean;
  address?: any;
  address_confidence?: number;
  shipping_preferences?: any;
}

interface BulkGiftData {
  template_id?: string;
  occasion: string;
  budget_per_gift: number;
  common_message: string;
  scheduled_delivery?: Date;
  selected_connections: string[];
  personalized_messages: { [key: string]: string };
  address_overrides: { [key: string]: any };
  gift_preferences: { [key: string]: any };
}

interface SmartBulkGiftingProps {
  onComplete: (giftData: BulkGiftData) => void;
  preselectedConnections?: string[];
}

const SmartBulkGifting: React.FC<SmartBulkGiftingProps> = ({
  onComplete,
  preselectedConnections = []
}) => {
  const { profile } = useProfile();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('select');
  const [giftData, setGiftData] = useState<BulkGiftData>({
    occasion: '',
    budget_per_gift: 50,
    common_message: '',
    selected_connections: preselectedConnections,
    personalized_messages: {},
    address_overrides: {},
    gift_preferences: {}
  });

  useEffect(() => {
    fetchConnections();
  }, [profile]);

  const fetchConnections = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select(`
          id,
          connected_user_id,
          relationship_type,
          profiles!user_connections_connected_user_id_fkey(
            name,
            email,
            profile_image,
            gift_preferences,
            shipping_address
          ),
          user_addresses!user_addresses_user_id_fkey(
            id,
            name,
            address,
            is_default
          )
        `)
        .eq('user_id', profile.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedConnections: Connection[] = (data || []).map(conn => {
        const connProfile = conn.profiles as any;
        const addresses = Array.isArray(conn.user_addresses) ? conn.user_addresses as any[] : [];
        const primaryAddress = addresses?.find(addr => addr.is_default) || addresses?.[0];

        return {
          id: conn.id,
          connected_user_id: conn.connected_user_id,
          name: connProfile?.name || 'Unknown User',
          email: connProfile?.email,
          profile_image: connProfile?.profile_image,
          relationship_type: conn.relationship_type,
          has_address: Boolean(primaryAddress),
          address: primaryAddress?.address,
          address_confidence: primaryAddress ? 95 : 0,
          shipping_preferences: connProfile?.shipping_preferences
        };
      });

      setConnections(formattedConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: any) => {
    setGiftData(prev => ({
      ...prev,
      template_id: template.id,
      occasion: template.occasion,
      budget_per_gift: template.budget_range.max,
      common_message: template.default_message,
      selected_connections: prev.selected_connections.length > 0 
        ? prev.selected_connections 
        : connections
            .filter(c => template.recipient_types.includes(c.relationship_type))
            .map(c => c.id)
    }));
    
    setActiveTab('configure');
    toast.success(`Template "${template.name}" applied`);
  };

  const handleConnectionToggle = (connectionId: string) => {
    setGiftData(prev => ({
      ...prev,
      selected_connections: prev.selected_connections.includes(connectionId)
        ? prev.selected_connections.filter(id => id !== connectionId)
        : [...prev.selected_connections, connectionId]
    }));
  };

  const handleSelectAll = () => {
    setGiftData(prev => ({
      ...prev,
      selected_connections: connections.map(c => c.id)
    }));
  };

  const handleSelectNone = () => {
    setGiftData(prev => ({
      ...prev,
      selected_connections: []
    }));
  };

  const handleSmartSelection = () => {
    // Smart selection based on occasion and relationship types
    const smartConnections = connections.filter(conn => {
      if (giftData.occasion === 'Birthday') {
        return ['friend', 'family', 'partner'].includes(conn.relationship_type);
      }
      if (giftData.occasion === 'Holiday') {
        return ['family', 'friend', 'partner'].includes(conn.relationship_type);
      }
      return true;
    });

    setGiftData(prev => ({
      ...prev,
      selected_connections: smartConnections.map(c => c.id)
    }));

    toast.success(`Smart selection applied - ${smartConnections.length} recipients selected`);
  };

  const handlePersonalizeMessage = (connectionId: string, message: string) => {
    setGiftData(prev => ({
      ...prev,
      personalized_messages: {
        ...prev.personalized_messages,
        [connectionId]: message
      }
    }));
  };

  const generatePersonalizedMessages = () => {
    const selectedConns = connections.filter(c => giftData.selected_connections.includes(c.id));
    const messages: { [key: string]: string } = {};

    selectedConns.forEach(conn => {
      const baseMessage = giftData.common_message || `Happy ${giftData.occasion}!`;
      
      // Personalize based on relationship type
      if (conn.relationship_type === 'family') {
        messages[conn.id] = `${baseMessage} Love you so much, ${conn.name}! 💕`;
      } else if (conn.relationship_type === 'friend') {
        messages[conn.id] = `${baseMessage} Hope you love this, ${conn.name}! 🎉`;
      } else if (conn.relationship_type === 'colleague') {
        messages[conn.id] = `${baseMessage} Thank you for being such a great colleague, ${conn.name}!`;
      } else {
        messages[conn.id] = `${baseMessage} Thinking of you, ${conn.name}!`;
      }
    });

    setGiftData(prev => ({
      ...prev,
      personalized_messages: messages
    }));

    toast.success('Personalized messages generated');
  };

  const validateAddresses = () => {
    const selectedConns = connections.filter(c => giftData.selected_connections.includes(c.id));
    const withoutAddresses = selectedConns.filter(c => !c.has_address);
    
    if (withoutAddresses.length > 0) {
      toast.error(`${withoutAddresses.length} recipients missing addresses`);
      return false;
    }
    
    return true;
  };

  const handleComplete = () => {
    if (!validateAddresses()) return;
    
    if (giftData.selected_connections.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    onComplete(giftData);
    toast.success(`Bulk gift configured for ${giftData.selected_connections.length} recipients`);
  };

  const selectedConnections = connections.filter(c => giftData.selected_connections.includes(c.id));
  const totalCost = selectedConnections.length * giftData.budget_per_gift;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-muted-foreground">Loading connections...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Smart Bulk Gifting</h2>
        <Badge variant="secondary">
          {selectedConnections.length} recipients selected
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="template">Template</TabsTrigger>
          <TabsTrigger value="select">Select</TabsTrigger>
          <TabsTrigger value="configure">Configure</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
        </TabsList>

        {/* Template Selection */}
        <TabsContent value="template" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Choose a Template</CardTitle>
            </CardHeader>
            <CardContent>
              <TemplateManager
                onTemplateSelect={handleTemplateSelect}
                mode="selection"
                showCreateButton={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recipient Selection */}
        <TabsContent value="select" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Recipients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={handleSelectNone}>
                  Select None
                </Button>
                <Button variant="outline" size="sm" onClick={handleSmartSelection}>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Smart Selection
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connections.map(connection => (
                  <Card key={connection.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={giftData.selected_connections.includes(connection.id)}
                          onCheckedChange={() => handleConnectionToggle(connection.id)}
                        />
                        <div>
                          <div className="font-medium">{connection.name}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {connection.relationship_type}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {connection.has_address ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        )}
                        <Badge variant="outline" className="text-xs">
                          {connection.address_confidence}%
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration */}
        <TabsContent value="configure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gift Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="occasion">Occasion</Label>
                  <Input
                    id="occasion"
                    value={giftData.occasion}
                    onChange={(e) => setGiftData(prev => ({ ...prev, occasion: e.target.value }))}
                    placeholder="Enter occasion"
                  />
                </div>
                <div>
                  <Label htmlFor="budget">Budget per Gift ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={giftData.budget_per_gift}
                    onChange={(e) => setGiftData(prev => ({ ...prev, budget_per_gift: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="commonMessage">Common Message</Label>
                <Textarea
                  id="commonMessage"
                  value={giftData.common_message}
                  onChange={(e) => setGiftData(prev => ({ ...prev, common_message: e.target.value }))}
                  placeholder="Enter a message for all recipients"
                  className="mt-1"
                />
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={generatePersonalizedMessages}
                  className="flex items-center gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Generate Personalized Messages
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Personalized Messages</Label>
                {selectedConnections.map(connection => (
                  <div key={connection.id} className="space-y-2">
                    <Label className="text-sm font-medium">{connection.name}</Label>
                    <Textarea
                      value={giftData.personalized_messages[connection.id] || giftData.common_message}
                      onChange={(e) => handlePersonalizeMessage(connection.id, e.target.value)}
                      placeholder={`Personalized message for ${connection.name}`}
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review */}
        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review & Confirm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{selectedConnections.length}</div>
                  <div className="text-sm text-muted-foreground">Recipients</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">${giftData.budget_per_gift}</div>
                  <div className="text-sm text-muted-foreground">Per Gift</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">${totalCost}</div>
                  <div className="text-sm text-muted-foreground">Total Cost</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Selected Recipients</h4>
                {selectedConnections.map(connection => (
                  <div key={connection.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{connection.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {connection.relationship_type} • {connection.has_address ? 'Address confirmed' : 'Address needed'}
                      </div>
                    </div>
                    <Badge variant="outline">
                      ${giftData.budget_per_gift}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleComplete}
                  disabled={selectedConnections.length === 0}
                  className="flex items-center gap-2"
                >
                  <Gift className="h-4 w-4" />
                  Complete Bulk Gift Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartBulkGifting;