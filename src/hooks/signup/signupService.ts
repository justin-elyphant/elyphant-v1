
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SignUpValues } from "@/components/auth/signup/SignUpForm";

export const signUpUser = async (values: SignUpValues, invitedBy: string | null, senderUserId: string | null) => {
  // Get the current site URL - using window.location.origin to get the ACTUAL current URL
  // This ensures we're not using localhost in the email if we're on the preview site
  const currentOrigin = window.location.origin;
  const redirectTo = `${currentOrigin}/sign-up?verified=true`; // Add verified parameter
  
  // Create account with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: {
        name: values.name,
        invited_by: invitedBy,
        sender_user_id: senderUserId,
      },
      emailRedirectTo: redirectTo,
    }
  });
  
  if (error) {
    throw error;
  }
  
  return data;
};

export const sendVerificationEmail = async (email: string, name: string) => {
  try {
    const currentOrigin = window.location.origin;
    
    // Send the actual origin, not a path - the edge function will handle the redirect path
    console.log("Using origin for verification:", currentOrigin);
    
    const emailResponse = await supabase.functions.invoke('send-verification-email', {
      body: {
        email: email,
        name: name,
        verificationUrl: currentOrigin
      }
    });
    
    console.log("Email function response:", emailResponse);
    
    if (emailResponse.error) {
      console.error("Email function error:", emailResponse.error);
      throw new Error(emailResponse.error.message || "Failed to send verification email");
    }
    
    return { success: true };
  } catch (error) {
    console.error("Failed to send custom verification email:", error);
    return { success: false, error };
  }
};

export const resendDefaultVerification = async (email: string) => {
  const currentOrigin = window.location.origin;
  const redirectTo = `${currentOrigin}/sign-up?verified=true`; // Add verified parameter
  
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: redirectTo,
      }
    });
    
    if (error) {
      console.error("Failed to resend verification:", error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error in resendDefaultVerification:", error);
    return { success: false, error };
  }
};

export const updateUserProfile = async (userId: string, profileData: any) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId);
    
    if (error) {
      console.error("Error updating profile:", error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return { success: false, error };
  }
};

export const createConnection = async (senderUserId: string | null, userId: string, invitedBy: string | null) => {
  if (!senderUserId) return { success: true };
  
  try {
    // In a real app, this would create a connection in the database
    console.log(`Creating connection between ${senderUserId} and ${userId}`);
    
    // This would be a database insert to create a friend connection
    toast.success(`You're now connected with ${invitedBy || 'your gift sender'}!`);
    return { success: true };
  } catch (error) {
    console.error("Error creating connection:", error);
    return { success: false, error };
  }
};
