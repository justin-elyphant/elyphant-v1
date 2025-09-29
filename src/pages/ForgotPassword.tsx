import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { unifiedAuthService } from '@/services/auth/UnifiedAuthService';
import MainLayout from '@/components/layout/MainLayout';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      // Use UnifiedAuthService for enhanced security and logging
      const result = await unifiedAuthService.initiatePasswordReset(email);
      
      if (result.success) {
        toast.success(result.message || 'Password reset email sent! Check your inbox.');
      } else {
        toast.error(result.error || 'Unable to send reset email. Please try again.');
      }
    } catch (error: any) {
      toast.error('Unable to send reset email. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
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
        </div>
      </div>
    </MainLayout>
  );
};

export default ForgotPassword;