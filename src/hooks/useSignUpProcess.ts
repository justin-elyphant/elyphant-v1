
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { SignUpValues } from "@/components/auth/signup/SignUpForm";
import { useProfileImage } from "./signup/useProfileImage";
import { useEmailVerification } from "./signup/useEmailVerification";
import { useProfileData } from "./signup/useProfileData";
import { 
  signUpUser, 
  sendVerificationEmail, 
  resendDefaultVerification,
  updateUserProfile,
  createConnection
} from "./signup/signupService";
import { supabase } from "@/integrations/supabase/client";

export const useSignUpProcess = (invitedBy: string | null, senderUserId: string | null) => {
  const [step, setStep] = useState(1);
  const [profileType, setProfileType] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<SignUpValues | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const { profileImage, setProfileImage, handleImageUpload, uploadProfileImage } = useProfileImage();
  const { profileData, handleProfileDataChange } = useProfileData();
  
  // Create setIsVerified callback function to pass to useEmailVerification
  const [isVerifiedState, setIsVerifiedState] = useState(false);
  const setIsVerified = useCallback((value: boolean) => {
    setIsVerifiedState(value);
  }, []);

  // Effect to check if we're already logged in from a verification
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session) {
        console.log("User already has a session:", data.session.user);
        setUserId(data.session.user.id);
        setUserEmail(data.session.user.email);
        
        // If the user has logged in but we don't have form values yet,
        // create a basic form values object from the user data
        if (!formValues && data.session.user.email) {
          const name = data.session.user.user_metadata?.name || "User";
          setFormValues({
            name,
            email: data.session.user.email,
            password: "", // We don't need the password as they're already logged in
            captcha: ""
          });
        }
      }
    };
    
    checkSession();
  }, [formValues]);
  
  const { verificationChecking, isVerified, isLoading, checkEmailVerification } = useEmailVerification(
    emailSent, 
    userEmail, 
    isVerifiedState, 
    setIsVerified
  );

  const handleSignUpSubmit = async (values: SignUpValues) => {
    try {
      // Create user account
      const userData = await signUpUser(values, invitedBy, senderUserId);
      
      if (userData.user) {
        setUserId(userData.user.id);
        setUserEmail(values.email);
        
        // Send custom verification email
        try {
          // Get the actual current URL (not localhost)
          const currentOrigin = window.location.origin;
          console.log("Using origin for verification:", currentOrigin);
          
          const emailResult = await sendVerificationEmail(values.email, values.name, currentOrigin);
          
          if (!emailResult.success) {
            // Fall back to Supabase's default verification
            await resendDefaultVerification(values.email);
            toast.success("A verification email has been sent using our backup system.");
          } else {
            toast.success("Account created! Check your email for verification link.");
          }
          
          setEmailSent(true);
        } catch (emailError) {
          console.error("Failed to send verification email:", emailError);
          toast.error("Account created, but there was an issue sending the verification email.");
          
          // Fall back to Supabase's default verification
          await resendDefaultVerification(values.email);
          toast.success("A verification email has been sent using our backup system.");
          setEmailSent(true);
        }
        
        // Store form values for later steps
        setFormValues(values);
      }
    } catch (err: any) {
      console.error("Sign up error:", err);
      toast.error("Failed to create account", {
        description: err.message || "Please try again later",
      });
    }
  };

  const handleProfileTypeSelection = (type: string) => {
    setProfileType(type);
    // Move to the next step (profile customization)
    setStep(3);
  };

  const completeOnboarding = async () => {
    if (!userId) return false;
    
    try {
      // Upload profile image to storage if exists
      let profileImageUrl = await uploadProfileImage(userId, profileImage);
      
      // Update user profile with additional info
      const profileUpdateResult = await updateUserProfile(userId, {
        profile_image: profileImageUrl,
        profile_type: profileType,
        bio: profileData.bio,
        interests: profileData.interests,
      });
      
      if (!profileUpdateResult.success) {
        return false;
      }
      
      // If user was invited by someone (gift purchase), create a connection
      if (senderUserId) {
        await createConnection(senderUserId, userId, invitedBy);
      }
      
      toast.success("Profile set up successfully!");
      return true;
    } catch (err) {
      console.error("Error completing onboarding:", err);
      toast.error("Failed to complete profile setup");
      return false;
    }
  };

  // Wrapper to ensure this function returns a Promise<{ verified: boolean }>
  const handleVerificationCheck = async (): Promise<{ verified: boolean }> => {
    return await checkEmailVerification();
  };

  return {
    step,
    setStep,
    profileType,
    profileImage,
    profileData,
    formValues,
    userId,
    emailSent,
    setEmailSent,
    userEmail,
    setUserEmail,
    verificationChecking,
    isVerified,
    handleSignUpSubmit,
    handleProfileTypeSelection,
    handleImageUpload,
    handleProfileDataChange,
    completeOnboarding,
    checkEmailVerification: handleVerificationCheck,
    setIsVerified
  };
};
