import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import { useAuthWithRateLimit } from '@/hooks/useAuthWithRateLimit';
import { motion } from 'framer-motion';
import { triggerHapticFeedback } from '@/utils/haptics';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const { resetPassword, isLoading: loading } = useAuthWithRateLimit();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHapticFeedback('medium');
    
    if (!email) {
      triggerHapticFeedback('error');
      toast.error('Please enter your email address');
      return;
    }

    const { error } = await resetPassword(email);
    
    if (!error) {
      triggerHapticFeedback('success');
      toast.success('Password reset email sent!', {
        description: 'Please check your email for the reset link.',
      });
      setEmail('');
    } else {
      triggerHapticFeedback('error');
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-16 px-8 max-w-md min-h-[calc(100vh-200px)] flex items-center pt-safe pb-safe">
        <motion.div 
          className="w-full bg-card rounded-lg border p-6 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
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
                className="min-h-[44px] touch-manipulation"
              />
            </div>

            <motion.div
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Button 
                type="submit" 
                className="w-full min-h-[44px] touch-manipulation" 
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Email'}
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default ForgotPassword;