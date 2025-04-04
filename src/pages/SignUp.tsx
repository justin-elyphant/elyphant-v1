
import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Import our components
import SignUpForm, { SignUpValues } from "@/components/auth/signup/SignUpForm";
import ProfileTypeSelection from "@/components/auth/signup/ProfileTypeSelection";
import ProfileSetup from "@/components/auth/signup/ProfileSetup";

const SignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [profileType, setProfileType] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<SignUpValues | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Get invitation parameters from URL if present
  const invitedBy = searchParams.get('invitedBy');
  const senderUserId = searchParams.get('senderUserId');
  
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
        toast.success("Account created successfully!");
        
        // Store form values and continue to next step
        setFormValues(values);
        setStep(2);
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
      navigate("/dashboard");
    } catch (err) {
      console.error("Error completing onboarding:", err);
      toast.error("Failed to complete profile setup");
    }
  };

  return (
    <div className="container max-w-md mx-auto py-10 px-4">
      {invitedBy && (
        <div className="mb-4 p-4 bg-purple-50 rounded-md text-center">
          <p className="text-purple-700 font-medium">
            {invitedBy} has invited you to join! Sign up to connect and view your gift.
          </p>
        </div>
      )}
      
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
