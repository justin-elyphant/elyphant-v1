
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSignUpProcess } from "@/hooks/useSignUpProcess";

// Import our components
import SignUpContainer from "@/components/auth/signup/SignUpContainer";
import ProfileTypeSelection from "@/components/auth/signup/ProfileTypeSelection";
import ProfileSetup from "@/components/auth/signup/ProfileSetup";
import EmailVerificationView from "@/components/auth/signup/EmailVerificationView";
import InvitationBanner from "@/components/auth/signup/InvitationBanner";
import { toast } from "sonner";

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
    setEmailSent
  } = useSignUpProcess(invitedBy, senderUserId);

  const handleOnboardingComplete = async () => {
    const success = await completeOnboarding();
    if (success) {
      navigate("/dashboard");
    }
  };

  // Effect to handle verified parameter in URL and advance to profile type selection
  useEffect(() => {
    // Only process verification once to prevent loops
    if (verified && !verificationProcessed) {
      console.log("Detected verified=true in URL, processing verification flow");
      
      // If we have an email param, set it as the userEmail
      if (emailParam && !userEmail) {
        setUserEmail(emailParam);
        console.log("Setting email from URL parameter:", emailParam);
      }
      
      // Mark email as sent and verified
      setEmailSent(true);
      setIsVerified(true);
      setVerificationProcessed(true);
      
      // Move to profile type selection
      setStep(2);
      
      // Show success notification
      toast.success("Email verified successfully! Let's complete your profile setup.");
    }
  }, [verified, verificationProcessed, emailParam, userEmail, setIsVerified, setStep, setEmailSent, setUserEmail]);

  // Handle verification success and advance to next step
  useEffect(() => {
    if (isVerified && emailSent) {
      // If email is verified, move to profile type selection
      setStep(2);
    }
  }, [isVerified, emailSent, setStep]);

  // Handle checking verification status
  const handleCheckVerification = async () => {
    const result = await checkEmailVerification();
    return result;
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
