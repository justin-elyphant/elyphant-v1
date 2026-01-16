
import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SignUpFormComponent from "../signup/SignUpForm";
import { SignUpFormValues } from "../signup/SignUpForm";

interface SignUpFormProps {
  invitationData?: {
    connectionId: string;
    recipientEmail: string;
    recipientName: string;
    senderName: string;
  } | null;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ invitationData }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
                signup_source_param: invitationData ? 'invite' : 'header_cta',
                metadata_param: {
                  name: values.name,
                  signup_timestamp: new Date().toISOString(),
                  signup_flow: 'unified_auth',
                  invited_by: invitationData?.senderName
                },
                attribution_param: {
                  source: invitationData ? 'invite' : 'header_cta',
                  campaign: invitationData ? 'connection_invitation' : 'main_signup',
                  referrer: document.referrer || 'direct'
                }
              });
            } catch (identificationError) {
              console.error('Error setting user identification:', identificationError);
              // Don't block signup for this
            }
            
            // Invitation linking is handled by Auth.tsx via accept_invitation_by_token RPC
            // which also links associated auto_gifting_rules - no duplicate logic needed here
            
            toast.success("Account created! Complete your profile to get started.");
            
            // Welcome email will be triggered AFTER interests are collected in QuickInterestsModal
            
            // Set flag for new signup and profile completion needed
            localStorage.setItem("newSignUp", "true");
            localStorage.setItem("profileCompletionState", "pending");
            
            // Store signup context for intelligent routing
            if (invitationData) {
              // This user was invited as a gift recipient
              localStorage.setItem("signupContext", "gift_recipient");
              console.log("🎁 Gift recipient signup detected - will route to /wishlists after onboarding");
            } else {
              // This user signed up to give gifts
              localStorage.setItem("signupContext", "gift_giver");
              console.log("🎁 Gift giver signup detected - will route to /gifting after onboarding");
            }
            
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
  }, [navigate, invitationData]);

  return (
    <SignUpFormComponent 
      onSubmit={handleSignUp}
      isSubmitting={isSubmitting}
      invitationData={invitationData}
    />
  );
};

export default SignUpForm;
