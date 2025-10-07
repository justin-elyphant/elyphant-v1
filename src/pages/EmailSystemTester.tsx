import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface TestResult {
  triggerName: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  data?: any;
  timestamp: string;
}

const EmailSystemTester = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [selectedTrigger, setSelectedTrigger] = useState('all');

  const emailTriggers = [
    { 
      id: 'all', 
      name: 'Test All Triggers', 
      description: 'Run comprehensive test of all email triggers',
      function: null 
    },
    { 
      id: 'welcome', 
      name: 'Welcome Email', 
      description: 'User signup welcome message',
      function: 'send-welcome-wishlist'
    },
    { 
      id: 'order_confirmation', 
      name: 'Order Confirmation', 
      description: 'E-commerce order confirmation',
      function: 'ecommerce-email-orchestrator'
    },
    { 
      id: 'payment_confirmation', 
      name: 'Payment Confirmation', 
      description: 'Payment successful notification',
      function: 'ecommerce-email-orchestrator'
    },
    { 
      id: 'order_status', 
      name: 'Order Status Update', 
      description: 'Shipping and delivery updates',
      function: 'ecommerce-email-orchestrator'
    },
    { 
      id: 'abandoned_cart', 
      name: 'Abandoned Cart Recovery', 
      description: 'Cart abandonment reminder',
      function: 'ecommerce-email-orchestrator'
    },
    { 
      id: 'gift_invitation', 
      name: 'Gift Invitation', 
      description: 'Social gift sharing invitation',
      function: 'send-invitation-email'
    },
    { 
      id: 'auto_gift_approval', 
      name: 'Auto-Gift Approval', 
      description: 'Auto-gifting approval reminder',
      function: 'send-auto-gift-approval-email'
    },
    { 
      id: 'profile_completion', 
      name: 'Profile Completion Reminder', 
      description: 'Onboarding completion nudge',
      function: 'ecommerce-email-orchestrator'
    },
    { 
      id: 'connection_nudge', 
      name: 'Connection Nudge', 
      description: 'Social connection reminder',
      function: 'send-reminder-email'
    }
  ];

  const addResult = (result: TestResult) => {
    setResults(prev => [result, ...prev]);
  };

  const testSingleTrigger = async (trigger: typeof emailTriggers[0]) => {
    if (!trigger.function) return;

    addResult({
      triggerName: trigger.name,
      status: 'pending',
      message: 'Testing...',
      timestamp: new Date().toLocaleTimeString()
    });

    try {
      console.log(`Testing ${trigger.name} via ${trigger.function}`);
      
      // Prepare test data based on trigger type
      let testData: any = {};

      switch (trigger.id) {
        case 'welcome':
          testData = {
            userId: '0478a7d7-9d59-40bf-954e-657fa28fe251',
            userEmail: testEmail,
            userFirstName: 'Test User',
            birthYear: 1990,
            interests: ['tech', 'books'],
            appBaseUrl: window.location.origin
          };
          break;
        case 'gift_invitation':
          testData = {
            recipientEmail: testEmail,
            inviterName: 'Test Inviter',
            invitationType: 'friend_invite'
          };
          break;
        case 'auto_gift_approval':
          testData = {
            recipientEmail: testEmail,
            giftDetails: { name: 'Test Gift', price: 25.0 },
            approvalDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          };
          break;
        case 'order_confirmation':
        case 'payment_confirmation': {
          // Fetch the most recent order for the test user
          const { data: latestOrder } = await supabase
            .from('orders')
            .select('id')
            .eq('user_id', '0478a7d7-9d59-40bf-954e-657fa28fe251')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (!latestOrder?.id) {
            throw new Error('No orders found for the test user to send an order confirmation.');
          }

          testData = {
            order_id: latestOrder.id,
            user_email: testEmail,
            payment_method_used: 'saved_payment_method'
          };
          break;
        }
        case 'order_status': {
          // Map to orchestrator expected payload
          const { data: latestOrder } = await supabase
            .from('orders')
            .select('id')
            .eq('user_id', '0478a7d7-9d59-40bf-954e-657fa28fe251')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (!latestOrder?.id) {
            throw new Error('No orders found for the test user to send a status update.');
          }

          testData = {
            eventType: 'order_status_changed',
            orderId: latestOrder.id,
            customData: { status: 'shipped' }
          };
          break;
        }
        default:
          testData = {
            eventType: trigger.id,
            userId: '0478a7d7-9d59-40bf-954e-657fa28fe251',
            userEmail: testEmail
          };
      }

      const { data, error } = await supabase.functions.invoke(trigger.function, {
        body: testData
      });

      if (error) {
        addResult({
          triggerName: trigger.name,
          status: 'error',
          message: `Error: ${error.message}`,
          data: error,
          timestamp: new Date().toLocaleTimeString()
        });
      } else {
        addResult({
          triggerName: trigger.name,
          status: 'success',
          message: 'Email trigger executed successfully',
          data: data,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    } catch (error: any) {
      addResult({
        triggerName: trigger.name,
        status: 'error',
        message: `Exception: ${error.message}`,
        data: error,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  };

  const runTests = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid test email address');
      return;
    }

    setIsLoading(true);
    setResults([]);

    try {
      if (selectedTrigger === 'all') {
        // Test all triggers sequentially to avoid rate limiting
        const triggersToTest = emailTriggers.filter(t => t.function);
        
        for (const trigger of triggersToTest) {
          await testSingleTrigger(trigger);
          // Small delay between tests
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        toast.success(`Completed testing ${triggersToTest.length} email triggers`);
      } else {
        const trigger = emailTriggers.find(t => t.id === selectedTrigger);
        if (trigger) {
          await testSingleTrigger(trigger);
          toast.success(`${trigger.name} test completed`);
        }
      }
    } catch (error) {
      console.error('Test execution error:', error);
      toast.error('Failed to complete email system tests');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'outline',
      pending: 'secondary'
    } as const;
    
    return (
      <Badge variant={variants[status]} className="ml-2">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Email System Comprehensive Tester</CardTitle>
          <CardDescription>
            Test all email triggers individually to ensure proper functionality and troubleshoot issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Test Email Address</Label>
              <Input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email to receive test notifications"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Email Trigger to Test</Label>
              <Select value={selectedTrigger} onValueChange={setSelectedTrigger}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger to test" />
                </SelectTrigger>
                <SelectContent>
                  {emailTriggers.map((trigger) => (
                    <SelectItem key={trigger.id} value={trigger.id}>
                      {trigger.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={runTests}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Running Tests...' : 'Run Email System Tests'}
          </Button>
          
          {results.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results</h3>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span className="font-medium">{result.triggerName}</span>
                        {getStatusBadge(result.status)}
                      </div>
                      <span className="text-sm text-muted-foreground">{result.timestamp}</span>
                    </div>
                    <p className="text-sm mt-2">{result.message}</p>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-sm cursor-pointer text-muted-foreground">
                          View Details
                        </summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailSystemTester;