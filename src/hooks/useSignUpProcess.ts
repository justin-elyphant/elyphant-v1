
import { useState, useEffect } from "react";
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
  const [profileData, setProfileData] = useState({
    bio: "",
    interests: [] as string[]
  });
  const [verificationChecking, setVerificationChecking] = useState(false);

  // Add effect to check verification status automatically every few seconds
  useEffect(() => {
    let interval: number | undefined;
    
    if (emailSent && userEmail) {
      setVerificationChecking(true);
      
      // Check immediately
      checkEmailVerification();
      
      // Then check every 5 seconds
      interval = window.setInterval(checkEmailVerification, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [emailSent, userEmail]);
  
  // Function to check email verification status
  const checkEmailVerification = async () => {
    if (!userEmail) return;
    
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error checking verification status:", error);
        return;
      }
      
      if (data?.session?.user?.email_confirmed_at) {
        // Clear interval if user is verified
        setVerificationChecking(false);
        
        // Proceed to next step
        toast.success("Your email has been verified successfully!");
        setStep(2);
      }
    } catch (err) {
      console.error("Error checking verification status:", err);
    }
  };

  const handleSignUpSubmit = async (values: SignUpValues) => {
    try {
      // Get the current site URL - using window.location.origin to get the ACTUAL current URL
      // This ensures we're not using localhost in the email if we're on the preview site
      const currentOrigin = window.location.origin;
      const redirectTo = `${currentOrigin}/dashboard`;
      
      // Create account with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
            invited_by: invitedBy,
            sender_user_id: senderUserId,
          },
          emailRedirectTo: redirectTo,
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
        
        // Send custom verification email immediately
        try {
          // Use window.location.origin to ensure we're using the correct URL even on preview sites
          const verificationUrl = `${currentOrigin}/dashboard?email=${encodeURIComponent(values.email)}`;

          console.log("Sending verification email with URL:", verificationUrl);
          
          const emailResponse = await supabase.functions.invoke('send-verification-email', {
            body: {
              email: values.email,
              name: values.name,
              verificationUrl: verificationUrl
            }
          });
          
          console.log("Email function response:", emailResponse);
          
          if (emailResponse.error) {
            throw new Error(emailResponse.error.message || "Failed to send verification email");
          }
          
          setEmailSent(true);
          toast.success("Account created! Check your email for verification link.");
        } catch (emailError) {
          console.error("Failed to send custom verification email:", emailError);
          toast.error("Account created, but there was an issue sending the verification email.");
          
          // Fall back to Supabase's default verification
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: values.email,
            options: {
              emailRedirectTo: redirectTo,
            }
          });
          
          if (resendError) {
            console.error("Failed to resend verification:", resendError);
          } else {
            toast.success("A verification email has been sent using our backup system.");
          }
          
          setEmailSent(true);
        }
        
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

  const handleProfileDataChange = (data: any) => {
    setProfileData(data);
  };

  const completeOnboarding = async () => {
    if (!userId) return false;
    
    try {
      // Upload profile image to storage if exists
      let profileImageUrl = profileImage;
      
      if (profileImage && profileImage.startsWith('data:')) {
        // Extract file data from base64 string
        const fileExt = profileImage.substring(profileImage.indexOf('/') + 1, profileImage.indexOf(';base64'));
        const fileName = `${userId}.${fileExt}`;
        const fileData = profileImage.replace(/^data:image\/\w+;base64,/, '');
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, decode(fileData), {
            contentType: `image/${fileExt}`,
            upsert: true
          });
          
        if (error) {
          console.error("Error uploading profile image:", error);
        } else if (data) {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
            
          profileImageUrl = publicUrlData.publicUrl;
        }
      }
      
      // Update user profile with additional info
      const { error } = await supabase
        .from('profiles')
        .update({
          profile_image: profileImageUrl,
          profile_type: profileType,
          bio: profileData.bio,
          interests: profileData.interests,
        })
        .eq('id', userId);
      
      if (error) {
        console.error("Error updating profile:", error);
        return false;
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
  
  // Helper function to decode base64 to binary
  function decode(base64String: string): Uint8Array {
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  return {
    step,
    setStep,
    profileType,
    profileImage,
    profileData,
    formValues,
    userId,
    emailSent,
    userEmail,
    verificationChecking,
    handleSignUpSubmit,
    handleProfileTypeSelection,
    handleImageUpload,
    handleProfileDataChange,
    completeOnboarding,
    checkEmailVerification
  };
};
