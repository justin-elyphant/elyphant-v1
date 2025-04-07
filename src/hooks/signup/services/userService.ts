import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SignUpValues } from "@/components/auth/signup/SignUpForm";

export const signUpUser = async (values: SignUpValues, invitedBy: string | null, senderUserId: string | null) => {
  try {
    console.log("Signing up user with admin API and bypassing email verification");
    
    // First, check if we're correctly configured
    // Instead of directly accessing .url property, log the project ref for debugging
    const projectRef = supabase.projectRef;
    console.log(`Will call create-user function in project: ${projectRef}`);
    
    // Create the user through our Edge Function instead of Supabase Auth directly
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
