
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";

// Import our new components
import SignUpForm, { SignUpValues } from "@/components/auth/signup/SignUpForm";
import ProfileTypeSelection from "@/components/auth/signup/ProfileTypeSelection";
import ProfileSetup from "@/components/auth/signup/ProfileSetup";

const SignUp = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [profileType, setProfileType] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userData, setUserData] = useLocalStorage("userData", null);
  const [formValues, setFormValues] = useState<SignUpValues | null>(null);
  
  const handleSignUpSubmit = (values: SignUpValues) => {
    // In a real app, this would send the data to an API
    toast.success("Account created successfully!");
    
    // Store user data in local storage for demo purposes
    setFormValues(values);
    
    // Move to the next step of onboarding
    setStep(2);
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

  const completeOnboarding = () => {
    // Update user data with final profile info
    setUserData({
      ...formValues,
      profileImage,
      profileType,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      wishlists: [],
      following: [],
      followers: [],
      onboardingCompleted: true
    });
    
    toast.success("Profile set up successfully!");
    navigate("/dashboard");
  };

  return (
    <div className="container max-w-md mx-auto py-10 px-4">
      {step === 1 && (
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription>
              Join our community to find perfect gifts and share your wishlist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpForm onSubmitSuccess={handleSignUpSubmit} />
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/sign-in" className="text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <ProfileTypeSelection onSelect={handleProfileTypeSelection} />
      )}

      {step === 3 && formValues && (
        <ProfileSetup 
          userName={formValues.name}
          profileImage={profileImage}
          onImageUpload={handleImageUpload}
          onComplete={completeOnboarding}
          onSkip={completeOnboarding}
        />
      )}
    </div>
  );
};

export default SignUp;
