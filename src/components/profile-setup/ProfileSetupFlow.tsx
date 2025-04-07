
import React, { useState } from "react";
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
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  
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
      // Save all profile data
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          dob: profileData.dob,
          shipping_address: profileData.shipping_address,
          gift_preferences: profileData.gift_preferences,
          data_sharing_settings: profileData.data_sharing_settings
        })
        .eq('id', user?.id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success("Profile setup complete!");
      onComplete();
    } catch (err) {
      console.error("Error completing profile setup:", err);
      toast.error("Failed to save profile data");
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
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
      
      <CardFooter className="flex justify-between">
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
            <Button onClick={handleNext}>Next Step</Button>
          ) : (
            <Button onClick={handleComplete}>Complete Setup</Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProfileSetupFlow;
