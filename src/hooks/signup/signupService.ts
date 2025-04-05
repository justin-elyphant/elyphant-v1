import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SignUpValues } from "@/components/auth/signup/SignUpForm";

export const signUpUser = async (values: SignUpValues, invitedBy: string | null, senderUserId: string | null) => {
  // Get the current site URL - using window.location.origin to get the ACTUAL current URL
  const currentOrigin = window.location.origin;
  const redirectTo = `${currentOrigin}/sign-up?verified=true&email=${encodeURIComponent(values.email)}`; 
  
  console.log("Sign up with redirect to:", redirectTo);
  
  // Create account with Supabase Auth - IMPORTANT: emailRedirectTo is removed to prevent automatic email
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: {
        name: values.name,
        invited_by: invitedBy,
        sender_user_id: senderUserId,
      },
      // We removed emailRedirectTo to prevent Supabase from sending the default email
    }
  });
  
  if (error) {
    throw error;
  }
  
  return data;
};

export const sendVerificationEmail = async (email: string, name: string, verificationUrl: string) => {
  try {
    console.log("Sending verification email with base URL:", verificationUrl);
    
    // Make sure verification URL doesn't end with a slash
    const baseUrl = verificationUrl.endsWith('/') ? verificationUrl.slice(0, -1) : verificationUrl;
    
    const emailResponse = await supabase.functions.invoke('send-verification-email', {
      body: {
        email: email,
        name: name,
        verificationUrl: baseUrl, // Send just the origin, the function will append the path
        useVerificationCode: true // Tell the function to use verification code
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
  const redirectTo = `${currentOrigin}/sign-up?verified=true&email=${encodeURIComponent(email)}`;
  
  console.log("Resending verification with redirect to:", redirectTo);
  
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
