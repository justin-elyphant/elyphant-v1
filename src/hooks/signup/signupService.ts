
import { SignUpFormValues } from "@/components/auth/signup/forms/SignUpForm";
import { supabase } from "@/integrations/supabase/client";

// Modified to use Supabase auth directly with email_confirm=true
export const signUpUser = async (
  values: SignUpFormValues,
  invitedBy: string | null = null,
  senderUserId: string | null = null
) => {
  try {
    console.log(`Attempting direct signup for ${values.email}`);
    
    // Call the edge function directly to create pre-confirmed user
    const response = await supabase.functions.invoke('create-user', {
      body: {
        email: values.email,
        password: values.password,
        name: values.name,
        invitedBy,
        senderUserId
      }
    });
    
    if (response.error) {
      throw new Error(response.error.message || "Failed to create user");
    }
    
    console.log("User created successfully:", response.data);
    
    // Auto sign-in the user after creation
    if (response.data.success) {
      console.log("Auto signing in the user");
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });
      
      if (signInError) {
        console.error("Error signing in:", signInError);
        throw signInError;
      }
      
      console.log("User signed in successfully after creation:", data);
      
      // Force a session refresh to make sure auth state is updated
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error("Error refreshing session:", refreshError);
      } else {
        console.log("Session refreshed successfully");
      }
    }
    
    return response.data;
  } catch (error) {
    console.error("Error in signUpUser:", error);
    throw error;
  }
};

// Export the other services
export { 
  sendVerificationEmail,
  updateUserProfile,
  createConnection,
  resendDefaultVerification
} from './services';
