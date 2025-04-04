import React, { createContext, useState, useEffect, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Profile } from "@/types/supabase";
import { useNavigate } from "react-router-dom";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  getUserProfile: () => Promise<Profile | null>;
  resendVerificationEmail: () => Promise<void>;
  updateUserProfile: (updates: Partial<Profile>) => Promise<void>;
  deleteUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  getUserProfile: async () => null,
  resendVerificationEmail: async () => {},
  updateUserProfile: async () => {},
  deleteUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [bucketInitialized, setBucketInitialized] = useState(false);

  useEffect(() => {
    const initializeStorageBucket = async () => {
      try {
        const { data, error } = await supabase.storage.getBucket('avatars');
        
        if (error && error.message.includes('does not exist')) {
          await supabase.storage.createBucket('avatars', {
            public: true,
            fileSizeLimit: 1024 * 1024 * 5,
          });
          
          await supabase.storage.from('avatars').createSignedUrl('dummy.txt', 1);
        }
        
        setBucketInitialized(true);
      } catch (err) {
        console.error("Error initializing storage bucket:", err);
      }
    };
    
    initializeStorageBucket();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (event === 'SIGNED_IN') {
          toast.success('Signed in successfully!');
          navigate('/dashboard');
        } else if (event === 'SIGNED_OUT') {
          toast.info('Signed out');
        } else if (event === 'USER_UPDATED') {
          if (session?.user.email_confirmed_at) {
            toast.success('Email verified successfully!');
            navigate('/dashboard');
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getUserProfile = async () => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  };
  
  const updateUserProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      toast.error('You must be logged in to update your profile');
      return;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
      
    if (error) {
      console.error('Error updating user profile:', error);
      toast.error('Failed to update profile');
      throw error;
    }
    
    toast.success('Profile updated successfully');
  };
  
  const resendVerificationEmail = async () => {
    if (!user?.email) {
      toast.error('No email address available');
      return;
    }
    
    const currentUrl = window.location.origin;
    const redirectTo = `${currentUrl}/dashboard`;
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    
    if (error) {
      console.error('Error resending verification email:', error);
      toast.error('Failed to resend verification email');
    } else {
      toast.success('Verification email sent!');
    }
  };

  const sendDeletionEmail = async (email: string, name: string | null) => {
    try {
      const { error } = await supabase.functions.invoke('send-deletion-email', {
        body: { email, name }
      });
      
      if (error) throw error;
      
      console.log("Deletion confirmation email sent successfully");
    } catch (error) {
      console.error("Failed to send deletion confirmation email:", error);
      // Continue with deletion even if email fails
    }
  };

  const deleteUser = async () => {
    if (!user) {
      toast.error('You must be logged in to delete your account');
      return;
    }
    
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();
      
      if (user.email) {
        await sendDeletionEmail(user.email, profileData?.name);
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      const { error: authError } = await supabase.auth.admin.deleteUser(
        user.id
      );
      
      if (authError) throw authError;
      
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete account');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      signOut, 
      getUserProfile,
      resendVerificationEmail,
      updateUserProfile,
      deleteUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
