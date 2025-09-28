import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [testMode, setTestMode] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      // Add timeout to prevent getting stuck
      const timeoutPromise = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout - trying alternative method')), 10000)
      );

      const resetPromise = supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      const result = await Promise.race([resetPromise, timeoutPromise]);

      if (result.error) {
        throw result.error;
      } else {
        toast.success('Password reset email sent! Check your inbox.');
      }
    } catch (error: any) {
      console.log('Supabase auth timeout, switching to custom email service');
      
      // Fallback to our custom edge function if Supabase times out
      try {
        const { data, error: emailError } = await supabase.functions.invoke('send-password-reset-email', {
          body: {
            email: email,
            resetLink: `${window.location.origin}/reset-password?email=${encodeURIComponent(email)}`,
            userName: email.split('@')[0]
          }
        });

        if (emailError) {
          toast.error(`Failed to send reset email: ${emailError.message}`);
        } else {
          toast.success('Password reset email sent via backup service! Check your inbox.');
        }
      } catch (fallbackError) {
        toast.error('Both email services are currently unavailable. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!email) {
      toast.error('Please enter an email address to test');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset-email', {
        body: {
          email: email,
          resetLink: `${window.location.origin}/reset-password?token=test-token-123`,
          userName: 'Test User'
        }
      });

      if (error) {
        toast.error(`Test failed: ${error.message}`);
      } else {
        toast.success('Test email sent successfully! Check your inbox.');
      }
    } catch (error) {
      toast.error('Failed to send test email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-md">
      <div className="bg-card rounded-lg border p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>
        
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Test Mode</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestMode(!testMode)}
            >
              {testMode ? 'Hide' : 'Show'} Test Panel
            </Button>
          </div>

          {testMode && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Test the password reset email template and delivery using your elyphant.ai domain.
              </p>
              <Button
                onClick={handleTestEmail}
                variant="secondary"
                size="sm"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Sending...' : 'Send Test Email'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;