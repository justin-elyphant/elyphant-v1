import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, AlertCircle, CheckCircle, Mail, Package, ShoppingCart, Gift, Users, Lock, Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_FUNCTIONS } from "@/integrations/supabase/function-types";

interface EventTypeOption {
  value: string;
  label: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  requiredFields: ('orderId' | 'userId' | 'cartSessionId' | 'customData')[];
}

const eventTypes: EventTypeOption[] = [
  // Core E-Commerce
  { value: 'order.confirmed', label: 'Order Confirmation', category: 'Orders', icon: Package, description: 'Sent when order is created', requiredFields: ['customData'] },
  { value: 'order.status_update', label: 'Order Status Update', category: 'Orders', icon: Package, description: 'Order status changed (shipped, delivered)', requiredFields: ['customData'] },
  { value: 'order.cancelled', label: 'Order Cancellation', category: 'Orders', icon: Package, description: 'Order was cancelled', requiredFields: ['customData'] },
  { value: 'cart.abandoned', label: 'Abandoned Cart', category: 'Orders', icon: ShoppingCart, description: 'Cart left without checkout', requiredFields: ['customData'] },
  { value: 'post_purchase.followup', label: 'Post-Purchase Follow-up', category: 'Orders', icon: ShoppingCart, description: 'Follow-up after purchase', requiredFields: ['customData'] },
  
  // Gifting
  { value: 'gift.invitation', label: 'Gift Invitation', category: 'Gifting', icon: Gift, description: 'Invitation to receive a gift', requiredFields: ['customData'] },
  { value: 'auto_gift.approval_request', label: 'Auto Gift Approval', category: 'Gifting', icon: Gift, description: 'Auto gift needs approval', requiredFields: ['customData'] },
  { value: 'gift.purchased_notification', label: 'Gift Purchased Notification', category: 'Gifting', icon: Gift, description: 'Someone bought a gift for you', requiredFields: ['customData'] },
  
  // Connections
  { value: 'connection.invitation', label: 'Connection Invitation', category: 'Connections', icon: Users, description: 'Invite to connect', requiredFields: ['customData'] },
  { value: 'connection.established', label: 'Connection Established', category: 'Connections', icon: Users, description: 'Connection request accepted', requiredFields: ['customData'] },
  
  // Onboarding & Engagement
  { value: 'onboarding.welcome', label: 'Welcome Email', category: 'Onboarding', icon: Mail, description: 'Welcome new users', requiredFields: ['customData'] },
  { value: 'onboarding.birthday_reminder', label: 'Birthday Reminder', category: 'Onboarding', icon: Gift, description: 'Birthday gift reminder', requiredFields: ['customData'] },
  
  // Wishlist
  { value: 'wishlist.purchase_notification', label: 'Wishlist Item Purchased', category: 'Wishlist', icon: Heart, description: 'Someone bought your wishlist item', requiredFields: ['customData'] },
  { value: 'wishlist.item_back_in_stock', label: 'Item Back in Stock', category: 'Wishlist', icon: Heart, description: 'Wishlist item is back in stock', requiredFields: ['customData'] },
];

const EmailOrchestratorTester: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [testEmail, setTestEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [userId, setUserId] = useState('');
  const [cartSessionId, setCartSessionId] = useState('');
  const [customData, setCustomData] = useState('{}');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  const selectedEventType = eventTypes.find(e => e.value === selectedEvent);

  console.log('[EmailOrchestratorTester] mounted/rendered');

  const validateForm = () => {
    if (!selectedEvent) {
      toast.error('Please select an event type');
      return false;
    }

    if (!testEmail.trim()) {
      toast.error('Test email address is required');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (selectedEventType) {
      if (selectedEventType.requiredFields.includes('orderId') && !orderId.trim()) {
        toast.error('Order ID is required for this event type');
        return false;
      }
      if (selectedEventType.requiredFields.includes('userId') && !userId.trim()) {
        toast.error('User ID is required for this event type');
        return false;
      }
      if (selectedEventType.requiredFields.includes('cartSessionId') && !cartSessionId.trim()) {
        toast.error('Cart Session ID is required for this event type');
        return false;
      }
      if (selectedEventType.requiredFields.includes('customData')) {
        try {
          JSON.parse(customData);
        } catch {
          toast.error('Custom data must be valid JSON');
          return false;
        }
      }
    }

    return true;
  };

  const handleSendTest = async () => {
    if (!validateForm()) return;

    setSending(true);
    setResult(null);

    try {
      // Build data object
      const dataPayload: any = {};

      if (orderId.trim()) dataPayload.orderId = orderId.trim();
      if (userId.trim()) dataPayload.userId = userId.trim();
      if (cartSessionId.trim()) dataPayload.cartSessionId = cartSessionId.trim();
      
      if (customData.trim() !== '{}') {
        try {
          const parsedCustomData = JSON.parse(customData);
          Object.assign(dataPayload, parsedCustomData);
        } catch {
          // Already validated above
        }
      }

      // Build request with recipientEmail at top level
      const requestBody = {
        eventType: selectedEvent,
        recipientEmail: testEmail,  // Test email override
        data: dataPayload
      };

      console.log('Sending email orchestrator request:', requestBody);

      const { data, error } = await supabase.functions.invoke(
        SUPABASE_FUNCTIONS.ECOMMERCE_EMAIL_ORCHESTRATOR,
        { body: requestBody }
      );

      if (error) throw error;

      setResult(data);
      toast.success(`Test email sent successfully to ${testEmail}!`);
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast.error(`Failed to send test email: ${error.message}`);
      setResult({ error: error.message });
    } finally {
      setSending(false);
    }
  };

  const loadLatestOrder = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, order_number')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (orders && orders.length > 0) {
        setOrderId(orders[0].id);
        toast.success(`Loaded order: ${orders[0].order_number}`);
      } else {
        toast.error('No orders found');
      }
    } catch (error: any) {
      console.error('Error loading order:', error);
      toast.error('Failed to load latest order');
    }
  };

  const loadMyProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      setUserId(user.id);
      setTestEmail(user.email || '');
      toast.success('Loaded your profile');
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const generateMockData = () => {
    const mockDataMap: Record<string, any> = {
      'order.confirmed': {
        first_name: 'Sarah',
        order_number: 'ORD-2024-1234',
        total_amount: '$89.97',
        order_date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        items: [
          { name: 'Wireless Headphones', quantity: 1, price: '$49.99' },
          { name: 'Phone Case', quantity: 2, price: '$19.99' }
        ],
        shipping_address: '123 Main St\nApt 4B\nNew York, NY 10001',
        tracking_url: 'https://elyphant.ai/track/ABC123'
      },
      'order.status_update': {
        first_name: 'Michael',
        order_number: 'ORD-2024-5678',
        status: 'Shipped',
        status_message: 'Your order is on its way!',
        tracking_url: 'https://elyphant.ai/track/XYZ789',
        estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
      },
      'order.cancelled': {
        first_name: 'Jennifer',
        order_number: 'ORD-2024-9012',
        cancellation_reason: 'Customer requested cancellation',
        refund_amount: '$125.50',
        refund_timeline: '5-7 business days'
      },
      'cart.abandoned': {
        first_name: 'David',
        cart_items: [
          { title: 'Smart Watch', price: '$299.99', image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30' },
          { title: 'Fitness Tracker', price: '$79.99', image_url: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9' }
        ],
        cart_total: '$379.98',
        cart_url: 'https://elyphant.ai/cart'
      },
      'post_purchase.followup': {
        first_name: 'Amanda',
        order_number: 'ORD-2024-3456',
        product_names: ['Laptop Stand', 'Wireless Mouse'],
        feedback_url: 'https://elyphant.ai/feedback',
        support_url: 'https://elyphant.ai/support'
      },
      'gift.invitation': {
        sender_name: 'Emily',
        recipient_name: 'James',
        occasion: 'Birthday',
        message: 'Happy Birthday! Hope you find something you love!',
        invitation_url: 'https://elyphant.ai/gift/accept/abc123'
      },
      'auto_gift.approval_request': {
        recipient_name: 'Lisa',
        occasion: 'Anniversary',
        gift_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        suggested_gift: 'Premium Wireless Earbuds',
        budget: '$150.00',
        approval_url: 'https://elyphant.ai/approve/def456'
      },
      'gift.purchased_notification': {
        recipient_name: 'Robert',
        gift_name: 'Coffee Maker Deluxe',
        sender_name: 'Alex',
        occasion: 'Housewarming',
        expected_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
      },
      'connection.invitation': {
        sender_name: 'Jessica',
        sender_email: 'jessica@example.com',
        invitation_message: 'Let\'s connect on Elyphant! I\'d love to exchange gift ideas.',
        accept_url: 'https://elyphant.ai/connect/accept/ghi789'
      },
      'connection.established': {
        connection_name: 'Mark',
        connection_email: 'mark@example.com',
        profile_url: 'https://elyphant.ai/profile/mark'
      },
      'onboarding.welcome': {
        first_name: 'Taylor',
        dashboard_url: 'https://elyphant.ai/dashboard',
        profile_url: 'https://elyphant.ai/profile'
      },
      'onboarding.birthday_reminder': {
        first_name: 'Chris',
        recipient_name: 'Jordan',
        days_until: '7',
        occasion: 'Birthday',
        setup_url: 'https://elyphant.ai/gifts/setup'
      },
      'wishlist.purchase_notification': {
        first_name: 'Morgan',
        item_name: 'Designer Backpack',
        purchaser_name: 'Sam',
        expected_delivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
      },
      'wishlist.item_back_in_stock': {
        first_name: 'Casey',
        item_name: 'Limited Edition Sneakers',
        item_price: '$189.99',
        item_url: 'https://elyphant.ai/product/sneakers-123',
        item_image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2'
      }
    };

    const mockData = mockDataMap[selectedEvent] || {
      first_name: 'Test',
      name: 'Test User',
    };

    setCustomData(JSON.stringify(mockData, null, 2));
    toast.success('Generated realistic mock data');
  };

  const groupedEvents = eventTypes.reduce((acc, event) => {
    if (!acc[event.category]) {
      acc[event.category] = [];
    }
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, EventTypeOption[]>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-1 mb-2">Email Orchestrator Tester</h1>
        <p className="text-body text-muted-foreground">
          Test any email event type from the orchestrator without going through the full user journey
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Event Configuration
              </CardTitle>
              <CardDescription>
                Select event type and configure test parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="eventType">Event Type</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger id="eventType">
                    <SelectValue placeholder="Select an email event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(groupedEvents).map(([category, events]) => (
                      <SelectGroup key={category}>
                        <SelectLabel>{category}</SelectLabel>
                        {events.map((event) => (
                          <SelectItem key={event.value} value={event.value}>
                            <div className="flex items-center gap-2">
                              <event.icon className="h-4 w-4" />
                              {event.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                {selectedEventType && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedEventType.description}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="testEmail">Test Email Address *</Label>
                <Input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your-email@example.com"
                />
                <div className="flex items-start gap-2 mt-2 p-2 bg-primary/10 border border-primary/20 rounded-md">
                  <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-primary">
                    <strong>Safe Testing Mode:</strong> Test emails will be sent ONLY to this address, not to real users.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Parameters</CardTitle>
              <CardDescription>
                Fill in required parameters for the selected event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-[300px]">
                <div className="space-y-3 pr-4">
                  {selectedEventType?.requiredFields.includes('orderId') && (
                    <div>
                      <Label htmlFor="orderId" className="flex items-center gap-1">
                        Order ID
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="orderId"
                          value={orderId}
                          onChange={(e) => setOrderId(e.target.value)}
                          placeholder="Enter order ID"
                        />
                        <Button variant="outline" size="sm" onClick={loadLatestOrder}>
                          Latest
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedEventType?.requiredFields.includes('userId') && (
                    <div>
                      <Label htmlFor="userId" className="flex items-center gap-1">
                        User ID
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="userId"
                          value={userId}
                          onChange={(e) => setUserId(e.target.value)}
                          placeholder="Enter user ID"
                        />
                        <Button variant="outline" size="sm" onClick={loadMyProfile}>
                          My ID
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedEventType?.requiredFields.includes('cartSessionId') && (
                    <div>
                      <Label htmlFor="cartSessionId" className="flex items-center gap-1">
                        Cart Session ID
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="cartSessionId"
                        value={cartSessionId}
                        onChange={(e) => setCartSessionId(e.target.value)}
                        placeholder="Enter cart session ID"
                      />
                    </div>
                  )}

                  {selectedEventType?.requiredFields.includes('customData') && (
                    <div>
                      <Label htmlFor="customData" className="flex items-center gap-1">
                        Custom Data (JSON)
                        <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="customData"
                        value={customData}
                        onChange={(e) => setCustomData(e.target.value)}
                        placeholder='{"key": "value"}'
                        className="font-mono text-sm"
                        rows={8}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={generateMockData}
                        className="mt-2"
                      >
                        Generate Mock Data
                      </Button>
                    </div>
                  )}

                  {!selectedEvent && (
                    <div className="text-center text-muted-foreground py-8">
                      Select an event type to see required parameters
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Test Email Notice</p>
                  <p className="text-xs mt-1">
                    This directly invokes the email orchestrator and sends real emails via Resend.
                    Make sure RESEND_API_KEY is properly configured.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send Test Email</CardTitle>
              <CardDescription>
                Click below to trigger the email orchestrator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleSendTest} 
                disabled={sending || !selectedEvent || !testEmail}
                className="w-full"
                size="lg"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Sending Test Email...' : 'Send Test Email'}
              </Button>

              {result && (
                <div className="space-y-3">
                  {result.error ? (
                    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-red-900 dark:text-red-200">Error</p>
                        <p className="text-sm text-red-700 dark:text-red-300">{result.error}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900 dark:text-green-200">Success</p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Email sent to {testEmail}
                        </p>
                      </div>
                    </div>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Response Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-slate-100 dark:bg-slate-900 p-3 rounded overflow-auto max-h-60">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedEventType && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Selected Event Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedEventType.category}</Badge>
                  <selectedEventType.icon className="h-4 w-4" />
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>Event:</strong> {selectedEventType.label}</p>
                  <p><strong>Type:</strong> {selectedEventType.value}</p>
                  <p><strong>Description:</strong> {selectedEventType.description}</p>
                  <p><strong>Required Fields:</strong> {selectedEventType.requiredFields.join(', ')}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailOrchestratorTester;
