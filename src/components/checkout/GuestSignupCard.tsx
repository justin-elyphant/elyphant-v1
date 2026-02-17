import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, CheckCircle, Mail } from 'lucide-react';

interface GuestSignupCardProps {
  email: string;
  heading?: string;
  subheading?: string;
}

const GuestSignupCard: React.FC<GuestSignupCardProps> = ({
  email,
  heading = "You're almost an Elyphant!",
  subheading = "Create a free account to track your order, save wishlists, and get personalized gift recommendations.",
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signupError) {
        if (signupError.message?.includes('already registered')) {
          setError('This email already has an account. Try signing in instead.');
        } else {
          setError(signupError.message);
        }
        return;
      }

      // Attempt to claim guest orders immediately
      if (data.user) {
        try {
          const { data: claimData, error: claimError } = await supabase.functions.invoke('claim-guest-orders');
          if (claimError) {
            console.warn('[GuestSignup] Order claim attempt (may succeed on email verify):', claimError);
          } else {
            console.log('[GuestSignup] Claimed orders:', claimData?.claimed);
          }
        } catch (claimErr) {
          console.warn('[GuestSignup] Order claim failed (will retry on email verify):', claimErr);
        }
      }

      if (data.user && !data.user.email_confirmed_at) {
        toast.success('Account created! Check your email to verify.');
      } else {
        toast.success('Account created successfully!');
      }

      console.log('[GuestSignup] Conversion success', { email });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6 text-center space-y-3">
          <CheckCircle className="h-10 w-10 text-primary mx-auto" />
          <h3 className="text-lg font-semibold">Account Created!</h3>
          <p className="text-sm text-muted-foreground">
            Check your email at <span className="font-medium">{email}</span> to verify your account.
          </p>
          <p className="text-xs text-muted-foreground">
            After verifying, we'll help you set up your profile for personalized gift recommendations, size matching, and more.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5 text-primary" />
          {heading}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{subheading}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Email</Label>
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            {email}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="guest-signup-password">Create a password</Label>
          <PasswordInput
            id="guest-signup-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="guest-signup-confirm">Confirm password</Label>
          <PasswordInput
            id="guest-signup-confirm"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleSignup}
            disabled={isLoading || !password}
            className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isLoading ? 'Creating...' : 'Create Free Account'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GuestSignupCard;
