
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
    
    // Try direct signup first - simpler and avoids edge function
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          name: values.name,
          invited_by: invitedBy,
          sender_user_id: senderUserId
        }
      }
    });
    
    if (signUpError) {
      // If signup failed with "already registered" error, try to get user details
      if (signUpError.message.includes("already registered")) {
        console.log("User already exists, trying direct sign-in");
        
        // Try signing in to check if credentials are valid
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password
        });
        
        if (signInError) {
          if (signInError.message.includes("Invalid login credentials")) {
            console.log("Invalid credentials for existing user");
            return {
              success: false, 
              code: "invalid_credentials",
              error: "Email exists but password is incorrect"
            };
          }
          throw signInError;
        }
        
        console.log("Signed in existing user successfully");
        return {
          success: true,
          user: signInData.user,
          session: signInData.session
        };
      }
      
      // For other errors, throw them to be handled by the caller
      throw signUpError;
    }
    
    console.log("User signed up successfully:", signUpData);
    
    // Auto sign-in the user after creation
    if (signUpData.user) {
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
    
    return {
      success: true,
      user: signUpData.user
    };
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
