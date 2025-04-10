import React from "react";
import { Button } from "@/components/ui/button";
import { useProfileForm } from "@/hooks/settings/useProfileForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { profileSchema } from "@/schemas/profileSchema";

import ProfileImageSection from "./ProfileImageSection";
import BasicInfoSection from "./BasicInfoSection";
import AddressSection from "./AddressSection";
import DeleteAccount from "./DeleteAccount";
import DataSharingSection from "./DataSharingSection";
import { InterestManager } from "./InterestManager";
import { ImportantDateManager } from "./ImportantDateManager";

const GeneralSettings = () => {
  
  const { 
    initialFormData,
    isLoading,
    handleProfileImageUpdate,
    addInterest,
    removeInterest,
    addImportantDate,
    removeImportantDate,
    saveProfile,
    user
  } = useProfileForm();

  
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: initialFormData,
    mode: "onBlur"
  });

  const onSubmit = async (data: any) => {
    try {
      await saveProfile(data);
      toast.success("Profile information updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-10">Loading profile information...</div>;
  }

  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <ProfileImageSection 
          currentImage={form.watch("profile_image")} 
          name={form.watch("name")} 
          onImageUpdate={handleProfileImageUpdate} 
        />
        
        <BasicInfoSection user={user} />
        
        <AddressSection />
        
        <DataSharingSection />
        
        <InterestManager 
          interests={form.watch("interests")}
          onAdd={addInterest}
          onRemove={removeInterest}
        />
        
        <ImportantDateManager
          importantDates={form.watch("importantDates")}
          onAdd={addImportantDate}
          onRemove={removeImportantDate}
        />
        
        <Button type="submit" className="w-full md:w-auto">
          Save Profile Information
        </Button>
        
        <DeleteAccount />
      </form>
    </Form>
  );
};

export default GeneralSettings;
