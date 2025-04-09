
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Stepper, Step, StepLabel } from "./Stepper";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import BasicInfoStep from "./steps/BasicInfoStep";
import DateOfBirthStep from "./steps/DateOfBirthStep";
import ShippingAddressStep from "./steps/ShippingAddressStep";
import GiftPreferencesStep from "./steps/GiftPreferencesStep";
import DataSharingStep from "./steps/DataSharingStep";
import { SharingLevel } from "@/types/supabase";

interface ProfileSetupFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const ProfileSetupFlow: React.FC<ProfileSetupFlowProps> = ({ onComplete, onSkip }) => {
  const { user, getUserProfile } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: "",
    dob: "",
    shipping_address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    },
    gift_preferences: [] as { category: string; importance: 'high' | 'medium' | 'low' }[],
    data_sharing_settings: {
      dob: "friends" as SharingLevel,
      shipping_address: "private" as SharingLevel,
      gift_preferences: "public" as SharingLevel
    }
  });

  // Fetch initial user data if available
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const profile = await getUserProfile();
        if (profile) {
          console.log("Loaded initial profile data:", profile);
          setProfileData(prevData => ({
            ...prevData,
            name: profile.name || prevData.name,
            dob: profile.dob || prevData.dob,
            shipping_address: profile.shipping_address || prevData.shipping_address,
            gift_preferences: profile.gift_preferences || prevData.gift_preferences,
            data_sharing_settings: profile.data_sharing_settings || prevData.data_sharing_settings
          }));
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
      }
    };
    
    fetchUserProfile();
  }, [user, getUserProfile]);

  const steps = [
    "Basic Info",
    "Birthday",
    "Shipping Address",
    "Gift Preferences",
    "Data Sharing"
  ];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      
      // Save all profile data
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          dob: profileData.dob,
          shipping_address: profileData.shipping_address,
          gift_preferences: profileData.gift_preferences,
          data_sharing_settings: profileData.data_sharing_settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log("Profile setup completed successfully:", data);
      toast.success("Profile updated successfully!");
      onComplete();
    } catch (err) {
      console.error("Error completing profile setup:", err);
      toast.error("Failed to save profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    toast.info("You can complete your profile later in settings");
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const validateCurrentStep = () => {
    switch (activeStep) {
      case 0:
        return !!profileData.name?.trim();
      case 1:
        return !!profileData.dob?.trim();
      case 2:
        return !!profileData.shipping_address?.street?.trim() &&
               !!profileData.shipping_address?.city?.trim() &&
               !!profileData.shipping_address?.state?.trim() &&
               !!profileData.shipping_address?.zipCode?.trim();
      case 3:
        return profileData.gift_preferences?.length > 0;
      case 4:
        return true;
      default:
        return true;
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-purple-700">Complete Your Profile</CardTitle>
        <CardDescription>
          This information helps us personalize your gifting experience
        </CardDescription>
        <Stepper activeStep={activeStep} className="mt-4">
          {steps.map((label, index) => (
            <Step key={index} completed={index < activeStep}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </CardHeader>
      
      <CardContent>
        <Separator className="mb-6" />
        
        {activeStep === 0 && (
          <BasicInfoStep 
            value={profileData.name}
            onChange={(name) => setProfileData(prev => ({ ...prev, name }))}
          />
        )}
        
        {activeStep === 1 && (
          <DateOfBirthStep
            value={profileData.dob}
            onChange={(dob) => setProfileData(prev => ({ ...prev, dob }))}
          />
        )}
        
        {activeStep === 2 && (
          <ShippingAddressStep
            value={profileData.shipping_address}
            onChange={(address) => setProfileData(prev => ({ ...prev, shipping_address: address }))}
          />
        )}
        
        {activeStep === 3 && (
          <GiftPreferencesStep
            values={profileData.gift_preferences}
            onChange={(preferences) => setProfileData(prev => ({ ...prev, gift_preferences: preferences }))}
          />
        )}
        
        {activeStep === 4 && (
          <DataSharingStep
            values={profileData.data_sharing_settings}
            onChange={(settings) => setProfileData(prev => ({ ...prev, data_sharing_settings: settings }))}
          />
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-4 border-t">
        <div>
          {activeStep > 0 ? (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          ) : (
            <Button variant="outline" onClick={handleSkip}>
              Skip for now
            </Button>
          )}
        </div>
        <div>
          {activeStep < steps.length - 1 ? (
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleNext}
              disabled={!validateCurrentStep() || isLoading}
            >
              Next Step
            </Button>
          ) : (
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleComplete}
              disabled={!validateCurrentStep() || isLoading}
            >
              {isLoading ? "Saving..." : "Complete Setup"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProfileSetupFlow;
