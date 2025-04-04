
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSignUpProcess } from "@/hooks/useSignUpProcess";

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
  
  const {
    step,
    profileType,
    profileImage,
    profileData,
    formValues,
    emailSent,
    userEmail,
    handleSignUpSubmit,
    handleProfileTypeSelection,
    handleImageUpload,
    handleProfileDataChange,
    completeOnboarding
  } = useSignUpProcess(invitedBy, senderUserId);

  const handleOnboardingComplete = async () => {
    const success = await completeOnboarding();
    if (success) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="container max-w-md mx-auto py-10 px-4">
      <InvitationBanner invitedBy={invitedBy} />
      
      {emailSent ? (
        <EmailVerificationView userEmail={userEmail} />
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
