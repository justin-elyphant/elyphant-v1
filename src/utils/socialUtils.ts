
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Function to fetch Facebook contacts from a user who logged in with Facebook
 * Note: The user must have granted 'user_friends' permission during login
 */
export const fetchFacebookContacts = async (): Promise<{id: string, name: string}[] | null> => {
  try {
    // Get current session to check if user is logged in with Facebook
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("You must be logged in to fetch contacts");
      return null;
    }
    
    // Check if logged in with Facebook
    const provider = session.user?.app_metadata?.provider;
    if (provider !== 'facebook') {
      toast.error("You must be logged in with Facebook to fetch contacts");
      return null;
    }
    
    // Get access token from session
    const accessToken = session.provider_token;
    if (!accessToken) {
      toast.error("Could not retrieve Facebook access token");
      return null;
    }
    
    // Fetch friends using Facebook Graph API
    const response = await fetch(`https://graph.facebook.com/v18.0/me/friends?access_token=${accessToken}`);
    const data = await response.json();
    
    if (!response.ok) {
      toast.error("Failed to fetch contacts", {
        description: data.error?.message || "Unknown error"
      });
      return null;
    }
    
    toast.success(`Found ${data.data.length} contacts from Facebook`);
    return data.data;
  } catch (error) {
    console.error("Error fetching Facebook contacts:", error);
    toast.error("Failed to fetch Facebook contacts");
    return null;
  }
};

/**
 * Function to connect with Facebook contacts in the application
 */
export const connectWithFacebookFriends = async (): Promise<boolean> => {
  try {
    const contacts = await fetchFacebookContacts();
    
    if (!contacts || contacts.length === 0) {
      return false;
    }
    
    // Here you would typically send these contacts to your backend
    // to find matching users in your database and create connections
    
    // This implementation is a placeholder - in a real application,
    // you would send this data to a Supabase edge function to process
    console.log("Would connect with these Facebook friends:", contacts);
    
    toast.success("Facebook contacts ready for connection");
    return true;
  } catch (error) {
    console.error("Error connecting with Facebook friends:", error);
    toast.error("Failed to connect with Facebook friends");
    return false;
  }
};

/**
 * Check if the current user has Facebook authentication connected
 */
export const hasFacebookAuth = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.app_metadata?.provider === 'facebook';
};
