
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SignUpValues } from "@/components/auth/signup/SignUpForm";

export const signUpUser = async (values: SignUpValues, invitedBy: string | null, senderUserId: string | null) => {
  try {
    console.log("Signing up user with admin API and bypassing email verification");
    
    // Create the user through our Edge Function
    console.log("Sending create-user request with body:", {
      email: values.email,
      name: values.name,
      password: "[REDACTED]",
      invitedBy: invitedBy,
      senderUserId: senderUserId
    });
    
    const response = await supabase.functions.invoke('create-user', {
      body: {
        email: values.email,
        password: values.password,
        name: values.name,
        invitedBy: invitedBy,
        senderUserId: senderUserId
      }
    });
    
    console.log("Create user response received:", {
      error: response.error ? {
        message: response.error.message,
        status: response.error.status,
        name: response.error.name
      } : null,
      data: response.data ? {
        success: response.data.success,
        hasUser: !!response.data.user,
        error: response.data.error,
        code: response.data.code
      } : null
    });
    
    // Check for response.data even if there's an error - the edge function might return useful data
    // with an error status code
    if (response.data?.code === "user_exists") {
      console.log("User already exists, attempting to sign in");
      
      // User exists, try to sign them in directly
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });
      
      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          throw new Error("Email already registered with a different password");
        }
        throw signInError;
      }
      
      // If we get here, sign in succeeded with the provided credentials
      console.log("Existing user signed in:", signInData);
      return { 
        success: true, 
        user: signInData.user,
        userExists: true
      };
    }
    
    if (response.error || !response.data?.success) {
      // Extract error details from the response if possible
      const errorMsg = response.data?.error || response.error?.message || "Failed to create user";
      
      // Handle specific error cases
      if (errorMsg.includes("already registered") || 
          response.data?.code === "user_exists") {
        throw new Error("Email already registered");
      }
      
      throw new Error(errorMsg);
    }
    
    console.log("User created successfully:", response.data.user);
    
    // After creating the user, sign them in automatically
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password
    });
    
    if (signInError) {
      console.error("Auto sign-in error:", signInError);
      // We don't throw here since the user was created successfully
    }
    
    return response.data;
  } catch (error) {
    console.error("Error in signUpUser:", error);
    throw error;
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
