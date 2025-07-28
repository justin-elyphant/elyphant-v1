import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, Clock, CheckCircle } from 'lucide-react';
import { useSMSGifteeDiscovery } from '@/hooks/useSMSGifteeDiscovery';
import { toast } from 'sonner';

interface SMSDiscoveryFormData {
  phoneNumber: string;
  recipientName: string;
  relationship: string;
  occasion: string;
  giftDate?: string;
}

const SMSDiscoveryComponent: React.FC = () => {
  const { loading, activeDiscoveries, initiateDiscovery, fetchActiveDiscoveries } = useSMSGifteeDiscovery();
  const [formData, setFormData] = useState<SMSDiscoveryFormData>({
    phoneNumber: '',
    recipientName: '',
    relationship: '',
    occasion: '',
    giftDate: ''
  });

  const handleFormChange = (field: keyof SMSDiscoveryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phoneNumber || !formData.recipientName || !formData.relationship || !formData.occasion) {
      toast.error('Please fill in all required fields');
      return;
    }

    const success = await initiateDiscovery(formData);
    if (success) {
      setFormData({
        phoneNumber: '',
        recipientName: '',
        relationship: '',
        occasion: '',
        giftDate: ''
      });
    }
  };

  React.useEffect(() => {
    fetchActiveDiscoveries();
  }, [fetchActiveDiscoveries]);

  return (
    <div className="space-y-6">
      {/* Initiate Discovery Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Start SMS Gift Discovery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Recipient Name *</Label>
                <Input
                  id="recipientName"
                  value={formData.recipientName}
                  onChange={(e) => handleFormChange('recipientName', e.target.value)}
                  placeholder="e.g., Sarah"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="relationship">Relationship *</Label>
                <Select value={formData.relationship} onValueChange={(value) => handleFormChange('relationship', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spouse">Spouse/Partner</SelectItem>
                    <SelectItem value="family">Family Member</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="colleague">Colleague</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="occasion">Occasion *</Label>
                <Select value={formData.occasion} onValueChange={(value) => handleFormChange('occasion', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="anniversary">Anniversary</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="graduation">Graduation</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="just-because">Just Because</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="giftDate">Gift Date (Optional)</Label>
              <Input
                id="giftDate"
                type="date"
                value={formData.giftDate}
                onChange={(e) => handleFormChange('giftDate', e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Sending SMS...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Start SMS Discovery
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Discoveries */}
      {activeDiscoveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active SMS Discoveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeDiscoveries.map((discovery) => (
                <div key={discovery.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h4 className="font-medium">{discovery.recipient_name}</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Phone: {discovery.phone_number}</p>
                        <p>Relationship: {discovery.relationship}</p>
                        <p>Occasion: {discovery.occasion}</p>
                        <p>Phase: {discovery.sms_conversation_state?.phase || 'greeting'}</p>
                      </div>
                      
                      {/* Show collected preferences */}
                      {Object.keys(discovery.preferences_collected || {}).length > 0 && (
                        <div className="mt-3 p-3 bg-muted rounded-md">
                          <h5 className="font-medium text-sm mb-2">Collected Preferences:</h5>
                          <div className="text-sm space-y-1">
                            {discovery.preferences_collected.interests && (
                              <p><strong>Interests:</strong> {discovery.preferences_collected.interests}</p>
                            )}
                            {discovery.preferences_collected.budget_preference && (
                              <p><strong>Budget:</strong> {discovery.preferences_collected.budget_preference}</p>
                            )}
                            {discovery.preferences_collected.brand_preferences && (
                              <p><strong>Brands:</strong> {discovery.preferences_collected.brand_preferences}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      {discovery.is_completed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SMSDiscoveryComponent;