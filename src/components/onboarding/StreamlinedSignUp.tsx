import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import StreamlinedSignUpForm from "./StreamlinedSignUpForm";

interface BetaSignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthday: Date;
  address: {
    street: string;
    line2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  interests?: string[];
}

interface StreamlinedSignUpProps {
  onComplete?: () => void;
}

const StreamlinedSignUp: React.FC<StreamlinedSignUpProps> = ({ 
  onComplete
}) => {
  const navigate = useNavigate();
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  console.log("🔄 Beta StreamlinedSignUp initialized");

  // Check if we have stored signup data - if not, redirect to auth
  useEffect(() => {
    const completionState = LocalStorageService.getProfileCompletionState();
    if (!completionState?.email) {
      console.warn("❌ No stored signup data found, redirecting to auth");
      navigate("/auth");
    }
  }, [navigate]);

  const handleProfileComplete = async (formData: BetaSignupData) => {
    setIsCreatingAccount(true);
    
    try {
      console.log("🚀 Creating Supabase account with collected data:", formData);
      
      // Create Supabase account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: `${formData.firstName} ${formData.lastName}`,
            first_name: formData.firstName,
            last_name: formData.lastName
          }
        }
      });
      
      if (authError) {
        console.error("❌ Account creation failed:", authError);
        throw new Error(authError.message);
      }
      
      if (!authData.user) {
        throw new Error("Failed to create user account");
      }
      
      console.log("✅ Account created successfully:", authData.user.id);
      
      // Create profile data
      const profileData = {
        id: authData.user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        username: `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}`.replace(/[^a-z0-9.]/g, ''),
        email: formData.email,
        dob: formData.birthday.toISOString(),
        birth_year: formData.birthday.getFullYear(),
        shipping_address: {
          address_line1: formData.address.street,
          address_line2: formData.address.line2 || null,
          city: formData.address.city,
          state: formData.address.state,
          zip_code: formData.address.zipCode,
          country: formData.address.country
        },
        interests: formData.interests || [],
        gift_preferences: (formData.interests || []).map(interest => ({
          category: interest,
          importance: "medium"
        })),
        onboarding_completed: true,
        user_type: 'shopper', // Set user_type for UX purposes
        data_sharing_settings: {
          dob: "friends",
          shipping_address: "private",
          gift_preferences: "public",
          email: "private"
        }
      };
      
      // Insert profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData as any);
      
      if (profileError) {
        console.error("❌ Profile creation failed:", profileError);
        throw new Error("Failed to create profile");
      }
      
      console.log("✅ Profile created successfully");
      
      // Clear stored data
      LocalStorageService.clearProfileCompletionState();
      localStorage.removeItem('beta_signup_data');
      
      toast.success("Account created successfully!", {
        description: "Welcome to Elyphant! Your account is ready."
      });
      
      // Navigate to profile setup completion
      navigate('/profile-setup');
      
      if (onComplete) {
        onComplete();
      }
      
    } catch (error: any) {
      console.error("❌ Beta account creation failed:", error);
      toast.error("Failed to create account", {
        description: error.message || "Please try again or contact support."
      });
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <div className="w-full">
          <Card className="w-full bg-background shadow-lg border border-border">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-foreground">
                  Complete Your Profile
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Tell us about yourself to personalize your experience
                </p>
              </div>
              
              <StreamlinedSignUpForm 
                onComplete={handleProfileComplete}
              />
              
              {isCreatingAccount && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 text-center">
                    Creating your account and setting up your profile...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default StreamlinedSignUp;
