
import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SignUpFormComponent from "../signup/SignUpForm";
import { SignUpFormValues } from "../signup/SignUpForm";
import { useWelcomeWishlist } from "@/hooks/useWelcomeWishlist";

const SignUpForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { scheduleDelayedWelcomeEmail } = useWelcomeWishlist();

  const handleSignUp = useCallback(async (values: SignUpFormValues) => {
    setIsSubmitting(true);
    try {
      console.log("📝 Starting simple signup with:", { name: values.name, email: values.email });
      
      const redirectUrl = `${window.location.origin}/profile-setup`;
      
      // Add retry logic for 504 errors
      const maxRetries = 3;
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 Signup attempt ${attempt}/${maxRetries}`);
          
          const { data, error } = await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: {
              data: {
                name: values.name,
                first_name: values.name.split(' ')[0] || '',
                last_name: values.name.split(' ').slice(1).join(' ') || '',
                signup_source: 'header_cta',
                user_type: 'shopper'
              },
              emailRedirectTo: redirectUrl
            }
          });
          
          if (error) {
            console.error(`❌ Signup error (attempt ${attempt}):`, error);
            
            // If it's a 504 timeout and we have retries left, continue
            if (error.status === 504 && attempt < maxRetries) {
              lastError = error;
              // Wait briefly before retry
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              continue;
            }
            throw error;
          }
          
          if (data.user) {
            console.log("✅ Account created successfully! Setting user identification...");
            
            // Set user identification for shoppers from header CTA
            try {
              await supabase.rpc('set_user_identification', {
                target_user_id: data.user.id,
                user_type_param: 'shopper',
                signup_source_param: 'header_cta',
                metadata_param: {
                  name: values.name,
                  signup_timestamp: new Date().toISOString(),
                  signup_flow: 'unified_auth'
                },
                attribution_param: {
                  source: 'header_cta',
                  campaign: 'main_signup',
                  referrer: document.referrer || 'direct'
                }
              });
            } catch (identificationError) {
              console.error('Error setting user identification:', identificationError);
              // Don't block signup for this
            }
            
            toast.success("Account created! Complete your profile to get started.");
            
            // Welcome email will be triggered AFTER interests are collected in QuickInterestsModal
            
            // Set flag for new signup and profile completion needed
            localStorage.setItem("newSignUp", "true");
            localStorage.setItem("profileCompletionState", "pending");
            
            // Redirect to profile setup where they'll complete profile then see interests modal
            navigate("/profile-setup", { replace: true });
            return;
          }
          
          // If we get here, something unexpected happened
          break;
          
        } catch (error: any) {
          lastError = error;
          
          // If it's a timeout and we have retries left, continue
          if (error.status === 504 && attempt < maxRetries) {
            console.log(`⏰ Timeout on attempt ${attempt}, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          
          // If it's not a timeout or we're out of retries, break
          break;
        }
      }
      
      // If we get here, all retries failed
      throw lastError;
      
    } catch (error: any) {
      console.error("❌ Simple signup failed:", error);
      
      if (error.status === 504) {
        toast.error("The signup service is experiencing high load. Please wait a moment and try again.");
      } else if (error.message?.includes('User already registered')) {
        toast.error("An account with this email already exists. Please try signing in instead.");
      } else {
        toast.error(error.message || "Failed to create account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [navigate]);

  return (
    <SignUpFormComponent 
      onSubmit={handleSignUp}
      isSubmitting={isSubmitting}
    />
  );
};

export default SignUpForm;
