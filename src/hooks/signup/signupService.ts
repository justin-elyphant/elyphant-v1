
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SignUpValues } from "@/components/auth/signup/SignUpForm";

export const signUpUser = async (values: SignUpValues, invitedBy: string | null, senderUserId: string | null) => {
  try {
    console.log("Signing up user with admin API and bypassing email verification");
    
    // Create the user through our Edge Function instead of Supabase Auth directly
    const response = await supabase.functions.invoke('create-user', {
      body: {
        email: values.email,
        password: values.password,
        name: values.name,
        invitedBy: invitedBy,
        senderUserId: senderUserId
      }
    });
    
    if (response.error) {
      console.error("Signup error from edge function:", response.error);
      
      // Try to extract more detailed error information
      const errorDetails = response.data?.details || {};
      const errorMessage = response.error.message || 
                          response.data?.error || 
                          "Unknown error occurred";
      
      // Check for user already exists error
      if (errorMessage.includes("already registered") || 
          errorDetails.msg?.includes("already registered") ||
          response.data?.code === "user_exists") {
        throw new Error("Email already registered");
      }
      
      // Check for validation errors with field information
      if (response.data?.field) {
        throw new Error(`${response.data.error || "Invalid input"} (${response.data.field})`);
      }
      
      // Check for other specific errors
      if (response.data?.status === 422) {
        const fieldInfo = response.data.field ? ` (${response.data.field})` : '';
        throw new Error(`Validation error${fieldInfo}: ${response.data.error || "Invalid input format"}`);
      }
      
      throw new Error(errorMessage);
    }
    
    if (!response.data?.success) {
      console.error("Signup failed:", response.data?.error);
      throw new Error(response.data?.error || "Failed to create user");
    }
    
    console.log("User created:", response.data.user);
    
    // After creating the user, sign them in automatically
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password
    });
    
    if (signInError) {
      console.error("Auto sign-in error:", signInError);
      // We don't throw here since the user was created successfully
      // They can still sign in manually
    }
    
    return response.data;
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
    
    // Handle potential rate-limiting with retries
    let retries = 0;
    const maxRetries = 2;
    let success = false;
    let emailResponse;
    
    while (retries <= maxRetries && !success) {
      if (retries > 0) {
        console.log(`Retrying email send (attempt ${retries + 1}/${maxRetries + 1})...`);
        // Add delay between retries
        await new Promise(resolve => setTimeout(resolve, retries * 1000));
      }
      
      emailResponse = await supabase.functions.invoke('send-verification-email', {
        body: {
          email: email,
          name: name,
          verificationUrl: baseUrl, // Send just the origin, the function will append the path
          useVerificationCode: true  // Explicitly request code-based verification
        }
      });
      
      console.log(`Email function response (attempt ${retries + 1}):`, emailResponse);
      
      if (!emailResponse.error) {
        success = true;
        break;
      }
      
      // If it's not a rate limit error, don't retry
      if (!isRateLimitError(emailResponse)) {
        break;
      }
      
      retries++;
    }
    
    if (emailResponse.error) {
      console.error("Email function error:", emailResponse.error);
      
      // Check for rate limiting from the error or data
      if (isRateLimitError(emailResponse)) {
        return { success: false, error: emailResponse.error, rateLimited: true };
      }
      
      throw new Error(emailResponse.error.message || "Failed to send verification email");
    }
    
    // Check for rate limiting in the response data
    if (emailResponse.data?.rateLimited) {
      return { success: false, error: "Rate limited", rateLimited: true };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Failed to send custom verification email:", error);
    return { success: false, error };
  }
};

// Helper function to check if an error is related to rate limiting
function isRateLimitError(response: any): boolean {
  // Check status code
  if (response.error?.status === 429 || response.status === 429) {
    return true;
  }
  
  // Check error message
  const errorMessage = response.error?.message || response.data?.error || '';
  if (
    errorMessage.toLowerCase().includes('rate') || 
    errorMessage.toLowerCase().includes('limit') ||
    errorMessage.toLowerCase().includes('too many')
  ) {
    return true;
  }
  
  // Check explicit rate limited flag
  if (response.data?.rateLimited) {
    return true;
  }
  
  return false;
}

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
    // First check if profile exists to avoid duplicate key errors
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (fetchError) {
      console.error("Error checking profile:", fetchError);
      return { success: false, error: fetchError };
    }
    
    let result;
    
    if (existingProfile) {
      // Update existing profile
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId);
      
      if (error) {
        console.error("Error updating profile:", error);
        return { success: false, error };
      }
      result = { success: true, created: false };
    } else {
      // Insert new profile
      const { error } = await supabase
        .from('profiles')
        .insert({ 
          id: userId,
          ...profileData 
        });
      
      if (error) {
        console.error("Error inserting profile:", error);
        return { success: false, error };
      }
      result = { success: true, created: true };
    }
    
    return result;
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
