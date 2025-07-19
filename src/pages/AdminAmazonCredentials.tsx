import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AmazonCredentials {
  email: string;
  is_verified: boolean;
  last_verified_at: string | null;
  created_at: string;
  credential_name: string;
  notes: string;
  verification_code: string | null;
}

const AdminAmazonCredentials = () => {
  const [credentials, setCredentials] = useState<AmazonCredentials | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    credential_name: 'Primary Amazon Business Account',
    notes: 'Main Elyphant Amazon Business account for order fulfillment',
    verification_code: ''
  });

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('manage-amazon-credentials', {
        body: { action: 'get' }
      });

      if (error) throw error;

      if (data?.credentials) {
        setCredentials(data.credentials);
        setFormData(prev => ({
          ...prev,
          email: data.credentials.email || '',
          credential_name: data.credentials.credential_name || 'Primary Amazon Business Account',
          notes: data.credentials.notes || 'Main Elyphant Amazon Business account for order fulfillment',
          verification_code: data.credentials.verification_code || ''
        }));
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
      toast.error('Failed to load Amazon credentials');
    } finally {
      setLoading(false);
    }
  };

  const saveCredentials = async () => {
    if (!formData.email || !formData.password) {
      toast.error('Email and password are required');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('manage-amazon-credentials', {
        body: {
          action: 'save',
          email: formData.email,
          password: formData.password,
          credential_name: formData.credential_name,
          notes: formData.notes,
          verification_code: formData.verification_code || null
        }
      });

      if (error) throw error;

      toast.success('Amazon credentials saved successfully!');
      await loadCredentials(); // Reload to get updated data
      setFormData(prev => ({ ...prev, password: '' })); // Clear password field
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast.error('Failed to save Amazon credentials');
    } finally {
      setLoading(false);
    }
  };

  const testCredentials = async () => {
    try {
      setLoading(true);
      // Call the test zinc order to verify credentials work
      const { data, error } = await supabase.functions.invoke('process-zinc-order', {
        body: {
          orderRequest: {
            retailer: "amazon",
            products: [{ product_id: "B001E4KFG0", quantity: 1 }],
            shipping_address: {
              first_name: "Test",
              last_name: "User",
              address_line1: "123 Main St",
              zip_code: "90210",
              city: "Beverly Hills",
              state: "CA",
              country: "US",
              phone_number: "5551234567"
            },
            billing_address: {
              first_name: "Test",
              last_name: "User",
              address_line1: "123 Main St",
              zip_code: "90210",
              city: "Beverly Hills",
              state: "CA",
              country: "US",
              phone_number: "5551234567"
            },
            payment_method: {
              name_on_card: "Test User",
              type: "credit",
              number: "4111111111111111",
              security_code: "123",
              expiration_month: 12,
              expiration_year: 2025,
              use_gift: false
            },
            shipping_method: "cheapest",
            is_gift: false,
            is_test: true
          },
          orderId: `admin-test-${Date.now()}`,
          paymentIntentId: "admin-test-payment-intent"
        }
      });

      if (data?.success) {
        toast.success('Amazon credentials are working correctly!');
      } else {
        toast.error(`Credential test failed: ${data?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error testing credentials:', error);
      toast.error('Failed to test credentials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCredentials();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Amazon Business Credentials Management</CardTitle>
          <CardDescription>
            Configure Amazon Business account credentials for Zinc order processing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {credentials && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-medium">Current Credentials Status</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Email:</span> {credentials.email}
                </div>
                <div>
                  <span className="font-medium">Verified:</span>{' '}
                  <span className={credentials.is_verified ? 'text-green-600' : 'text-red-600'}>
                    {credentials.is_verified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Last Verified:</span>{' '}
                  {credentials.last_verified_at 
                    ? new Date(credentials.last_verified_at).toLocaleString()
                    : 'Never'
                  }
                </div>
                <div>
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(credentials.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Amazon Business Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your-amazon-business@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="verification_code">2FA Verification Code (Optional)</Label>
            <Input
              id="verification_code"
              value={formData.verification_code}
              onChange={(e) => setFormData(prev => ({ ...prev, verification_code: e.target.value }))}
              placeholder="Enter 2FA code if required"
            />
          </div>

          <div>
            <Label htmlFor="credential_name">Credential Name</Label>
            <Input
              id="credential_name"
              value={formData.credential_name}
              onChange={(e) => setFormData(prev => ({ ...prev, credential_name: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <Button onClick={saveCredentials} disabled={loading}>
              {loading ? 'Saving...' : 'Save Credentials'}
            </Button>
            <Button onClick={testCredentials} variant="outline" disabled={loading || !credentials}>
              {loading ? 'Testing...' : 'Test Credentials'}
            </Button>
            <Button onClick={loadCredentials} variant="secondary" disabled={loading}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAmazonCredentials;