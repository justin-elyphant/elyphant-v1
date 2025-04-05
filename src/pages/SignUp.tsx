
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSignUpProcess } from "@/hooks/useSignUpProcess";
import { toast } from "sonner";

// Import our components
import SignUpContainer from "@/components/auth/signup/SignUpContainer";
import ProfileTypeSelection from "@/components/auth/signup/ProfileTypeSelection";
import ProfileSetup from "@/components/auth/signup/ProfileSetup";
import EmailVerificationView from "@/components/auth/signup/EmailVerificationView";
import InvitationBanner from "@/components/auth/signup/InvitationBanner";

const SignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get invitation parameters from URL if present
  const invitedBy = searchParams.get('invitedBy');
  const senderUserId = searchParams.get('senderUserId');
  const verified = searchParams.get('verified') === 'true';
  const emailParam = searchParams.get('email');
  
  // Store if we've already processed verification to prevent double-processing
  const [verificationProcessed, setVerificationProcessed] = useState(false);
  
  const {
    step,
    setStep,
    profileType,
    profileImage,
    profileData,
    formValues,
    emailSent,
    userEmail,
    setUserEmail,
    verificationChecking,
    isVerified,
    handleSignUpSubmit,
    handleProfileTypeSelection,
    handleImageUpload,
    handleProfileDataChange,
    completeOnboarding,
    checkEmailVerification,
    setIsVerified,
    setEmailSent,
    verifyWithCode
  } = useSignUpProcess(invitedBy, senderUserId);

  const handleOnboardingComplete = async () => {
    const success = await completeOnboarding();
    if (success) {
      navigate("/dashboard");
    }
  };

  // Effect to handle verified parameter in URL and advance to profile type selection
  useEffect(() => {
    console.log("URL params check - verified:", verified, "email:", emailParam, "step:", step);
    
    // Only process verification once to prevent loops
    if (verified && !verificationProcessed) {
      console.log("Processing verification from URL parameters");
      
      // If we have an email param, set it as the userEmail
      if (emailParam) {
        setUserEmail(emailParam);
        console.log("Setting email from URL parameter:", emailParam);
      }
      
      // Mark email as sent and verified
      setEmailSent(true);
      setIsVerified(true);
      setVerificationProcessed(true);
      
      // Move to profile type selection immediately
      setStep(2);
      
      // Show success notification
      toast.success("Email verified successfully! Let's complete your profile setup.");
    }
  }, [verified, verificationProcessed, emailParam, setIsVerified, setStep, setEmailSent, setUserEmail]);

  // Handle verification success and advance to next step
  useEffect(() => {
    if (isVerified && emailSent && step === 1) {
      console.log("Verified and email sent, advancing to step 2");
      // If email is verified, move to profile type selection
      setStep(2);
    }
  }, [isVerified, emailSent, step, setStep]);

  // Handle checking verification status
  const handleCheckVerification = async () => {
    console.log("Manual verification check initiated");
    const result = await checkEmailVerification();
    console.log("Verification check result:", result);
    return result;
  };

  // Handle verification with code
  const handleVerifyWithCode = async (code: string) => {
    if (!verifyWithCode) return false;
    
    console.log("Verifying with code:", code);
    const success = await verifyWithCode(code);
    
    if (success) {
      // Advance to the next step upon successful verification
      setStep(2);
    }
    
    return success;
  };

  console.log("Current step:", step);
  console.log("Email sent:", emailSent);
  console.log("Is verified:", isVerified);

  return (
    <div className="container max-w-md mx-auto py-10 px-4">
      <InvitationBanner invitedBy={invitedBy} />
      
      {emailSent && !isVerified ? (
        <EmailVerificationView 
          userEmail={userEmail}
          verificationChecking={verificationChecking}
          onCheckVerification={handleCheckVerification}
          isVerified={isVerified}
          onVerifyWithCode={handleVerifyWithCode}
        />
      ) : step === 1 ? (
        <SignUpContainer onSubmitSuccess={handleSignUpSubmit} />
      ) : step === 2 ? (
        <ProfileTypeSelection onSelect={handleProfileTypeSelection} />
      ) : formValues && (
        <ProfileSetup 
          userName={formValues.name}
          profileImage={profileImage}
          onImageUpload={handleImageUpload}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
          onProfileDataChange={handleProfileDataChange}
          initialProfileData={profileData}
        />
      )}
    </div>
  );
};

export default SignUp;
