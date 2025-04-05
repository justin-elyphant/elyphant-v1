
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SignUpValues } from "@/components/auth/signup/SignUpForm";

export const signUpUser = async (values: SignUpValues, invitedBy: string | null, senderUserId: string | null) => {
  try {
    // Get the current site URL - using window.location.origin to get the ACTUAL current URL
    const currentOrigin = window.location.origin;
    
    console.log("Sign up without redirect URL to prevent auto email");
    
    // Create account with Supabase Auth - IMPORTANT: We're explicitly NOT setting emailRedirectTo 
    // and NOT using autoconfirm to prevent Supabase from sending any emails
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          name: values.name,
          invited_by: invitedBy,
          sender_user_id: senderUserId,
        },
        emailRedirectTo: undefined // Explicitly set to undefined to prevent automatic email sending
      }
    });
    
    if (error) {
      console.error("Signup error:", error);
      throw error;
    }
    
    console.log("User created:", data);
    return data;
  } catch (error) {
    console.error("Error in signUpUser:", error);
    throw error;
  }
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
  // We're going to use our custom verification email instead
  try {
    const currentOrigin = window.location.origin;
    console.log("Resending custom verification for:", email);
    
    const result = await sendVerificationEmail(email, "", currentOrigin);
    return result;
  } catch (error) {
    console.error("Error in resendVerification:", error);
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
