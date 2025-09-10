
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Apple } from "lucide-react";
import { GoogleIcon } from "@/components/ui/icons/GoogleIcon";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type SocialProvider = 'google' | 'apple';

export const SocialLoginButtons = () => {
  const [socialLoading, setSocialLoading] = useState<{[key: string]: boolean}>({
    google: false,
    apple: false,
  });

  const handleSocialLogin = async (provider: SocialProvider) => {
    try {
      setSocialLoading({ ...socialLoading, [provider]: true });
      
      // OAuth users go to profile completion instead of dashboard
      const redirectUrl = `${window.location.origin}/auth/oauth-complete`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        }
      });
      
      if (error) {
        if (error.message.includes('provider is not enabled')) {
          toast.error(`${provider} sign-in not available`, {
            description: `Please contact the administrator to enable ${provider} authentication.`,
          });
        } else {
          toast.error(`${provider} sign-in failed`, {
            description: error.message,
          });
        }
      }
    } catch (err) {
      console.error(`${provider} sign-in error:`, err);
      toast.error(`Failed to sign in with ${provider}`);
    } finally {
      setSocialLoading({ ...socialLoading, [provider]: false });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Button 
        type="button" 
        variant="outline" 
        onClick={() => handleSocialLogin('google')}
        disabled={socialLoading.google}
        className="flex items-center justify-center gap-2"
      >
        <GoogleIcon className="h-5 w-5" />
        <span className="sr-only sm:not-sr-only sm:inline-block">Google</span>
      </Button>
      
      <Button 
        type="button" 
        variant="outline" 
        onClick={() => handleSocialLogin('apple')}
        disabled={socialLoading.apple}
        className="flex items-center justify-center gap-2"
      >
        <Apple className="h-5 w-5" />
        <span className="sr-only sm:not-sr-only sm:inline-block">Apple</span>
      </Button>
    </div>
  );
};
