
import React from "react";
import { Button } from "@/components/ui/button";
import { useProfileForm } from "@/hooks/settings/useProfileForm";

import ProfileImageSection from "./ProfileImageSection";
import BasicInfoSection from "./BasicInfoSection";
import AddressSection from "./AddressSection";
import InterestsFormSection from "./InterestsFormSection";
import ImportantDatesFormSection from "./ImportantDatesFormSection";
import DeleteAccount from "./DeleteAccount";
import DataSharingSection from "./DataSharingSection";
import { InterestManager } from "./InterestManager";
import { ImportantDateManager } from "./ImportantDateManager";

const GeneralSettings = () => {
  const { 
    formData,
    isLoading,
    handleChange,
    handleBirthdayChange,
    handleAddressAutocomplete,
    handleProfileImageUpdate,
    addInterest,
    removeInterest,
    addImportantDate,
    removeImportantDate,
    handleDataSharingChange,
    handleSubmit,
    user
  } = useProfileForm();

  if (isLoading) {
    return <div className="flex justify-center py-10">Loading profile information...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <ProfileImageSection 
        currentImage={formData.profile_image} 
        name={formData.name} 
        onImageUpdate={handleProfileImageUpdate} 
      />
      
      <BasicInfoSection 
        formData={formData}
        handleChange={handleChange}
        handleBirthdayChange={handleBirthdayChange}
        user={user}
      />
      
      <AddressSection 
        address={formData.address}
        handleChange={handleChange}
        handleAddressAutocomplete={handleAddressAutocomplete}
      />
      
      <DataSharingSection
        settings={formData.data_sharing_settings}
        onChange={handleDataSharingChange}
      />
      
      <InterestManager 
        interests={formData.interests}
        onAdd={addInterest}
        onRemove={removeInterest}
      />
      
      <ImportantDateManager
        importantDates={formData.importantDates}
        onAdd={addImportantDate}
        onRemove={removeImportantDate}
      />
      
      <Button type="submit" className="w-full md:w-auto">
        Save Profile Information
      </Button>
      
      <DeleteAccount />
    </form>
  );
};

export default GeneralSettings;
