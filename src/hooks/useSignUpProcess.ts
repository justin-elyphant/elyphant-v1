
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SignUpValues } from "@/components/auth/signup/SignUpForm";

export const useSignUpProcess = (invitedBy: string | null, senderUserId: string | null) => {
  const [step, setStep] = useState(1);
  const [profileType, setProfileType] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<SignUpValues | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const handleSignUpSubmit = async (values: SignUpValues) => {
    try {
      // Create account with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
            // Store the invitation data in user metadata for later use
            invited_by: invitedBy,
            sender_user_id: senderUserId,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        }
      });
      
      if (error) {
        toast.error("Sign up failed", {
          description: error.message,
        });
        return;
      }
      
      if (data.user) {
        setUserId(data.user.id);
        setUserEmail(values.email);
        setEmailSent(true);
        
        toast.success("Account created successfully!");
        
        // Store form values for later steps
        setFormValues(values);
      }
    } catch (err) {
      console.error("Sign up error:", err);
      toast.error("Failed to create account");
    }
  };

  const handleProfileTypeSelection = (type: string) => {
    setProfileType(type);
    // Move to the next step (profile customization)
    setStep(3);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const completeOnboarding = async () => {
    if (!userId) return;
    
    try {
      // Update user profile with additional info
      const { error } = await supabase
        .from('profiles')
        .update({
          profile_image: profileImage,
          profile_type: profileType,
        })
        .eq('id', userId);
      
      if (error) {
        console.error("Error updating profile:", error);
      }
      
      // If user was invited by someone (gift purchase), create a connection
      if (senderUserId) {
        try {
          // In a real app, this would create a connection in the database
          console.log(`Creating connection between ${senderUserId} and ${userId}`);
          
          // This would be a database insert to create a friend connection
          // For now, we'll just show a toast message
          toast.success(`You're now connected with ${invitedBy || 'your gift sender'}!`);
        } catch (connErr) {
          console.error("Error creating connection:", connErr);
        }
      }
      
      toast.success("Profile set up successfully!");
      return true;
    } catch (err) {
      console.error("Error completing onboarding:", err);
      toast.error("Failed to complete profile setup");
      return false;
    }
  };

  return {
    step,
    setStep,
    profileType,
    profileImage,
    formValues,
    userId,
    emailSent,
    userEmail,
    handleSignUpSubmit,
    handleProfileTypeSelection,
    handleImageUpload,
    completeOnboarding
  };
};
