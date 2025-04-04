
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/supabase";
import ProfileImageSection from "./ProfileImageSection";
import BasicInfoSection from "./BasicInfoSection";
import AddressSection from "./AddressSection";
import InterestsFormSection from "./InterestsFormSection";
import ImportantDatesFormSection from "./ImportantDatesFormSection";
import DeleteAccount from "./DeleteAccount";

const GeneralSettings = () => {
  const [userData, setUserData] = useLocalStorage("userData", null);
  const { user, getUserProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: userData?.name || "",
    email: userData?.email || "",
    username: userData?.username || "",
    birthday: userData?.birthday ? new Date(userData.birthday) : undefined,
    bio: userData?.bio || "",
    address: {
      street: userData?.address?.street || "",
      city: userData?.address?.city || "",
      state: userData?.address?.state || "",
      zipCode: userData?.address?.zipCode || "",
      country: userData?.address?.country || ""
    },
    interests: userData?.interests || [],
    importantDates: userData?.importantDates || [],
    profile_image: userData?.profile_image || null
  });
  
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const profileData = await getUserProfile();
          if (profileData) {
            setProfile(profileData);
            setFormData(prev => ({
              ...prev,
              name: profileData.name || prev.name,
              email: user.email || prev.email,
              profile_image: profileData.profile_image || prev.profile_image
            }));
          }
        } catch (error) {
          console.error("Error loading profile:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadProfile();
  }, [user, getUserProfile]);

  const [newInterest, setNewInterest] = useState("");
  const [newImportantDate, setNewImportantDate] = useState({
    date: undefined as Date | undefined,
    description: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleBirthdayChange = (date: Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      birthday: date
    }));
  };

  const handleAddressAutocomplete = (address: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      address: {
        street: address.address,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country
      }
    }));
  };

  const handleProfileImageUpdate = (url: string | null) => {
    setFormData(prev => ({
      ...prev,
      profile_image: url
    }));
  };

  const addInterest = () => {
    if (newInterest.trim() === "") return;
    
    setFormData(prev => ({
      ...prev,
      interests: [...prev.interests, newInterest.trim()]
    }));
    setNewInterest("");
  };

  const removeInterest = (index: number) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
  };

  const addImportantDate = () => {
    if (!newImportantDate.date || newImportantDate.description.trim() === "") return;
    
    setFormData(prev => ({
      ...prev,
      importantDates: [
        ...prev.importantDates, 
        {
          date: newImportantDate.date,
          description: newImportantDate.description
        }
      ]
    }));
    
    setNewImportantDate({
      date: undefined,
      description: ""
    });
  };

  const removeImportantDate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      importantDates: prev.importantDates.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setUserData({
      ...userData,
      name: formData.name,
      email: formData.email,
      username: formData.username,
      birthday: formData.birthday,
      bio: formData.bio,
      address: formData.address,
      interests: formData.interests,
      importantDates: formData.importantDates,
      profile_image: formData.profile_image
    });
    
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: formData.name
          })
          .eq('id', user.id);
          
        if (error) throw error;
      } catch (error) {
        console.error("Error updating profile:", error);
        toast.error("Failed to update profile in database");
        return;
      }
    }
    
    toast.success("Profile information updated successfully");
  };

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
      
      <InterestsFormSection 
        interests={formData.interests}
        removeInterest={removeInterest}
        newInterest={newInterest}
        setNewInterest={setNewInterest}
        addInterest={addInterest}
      />
      
      <ImportantDatesFormSection 
        importantDates={formData.importantDates}
        removeImportantDate={removeImportantDate}
        newImportantDate={newImportantDate}
        setNewImportantDate={setNewImportantDate}
        addImportantDate={addImportantDate}
      />
      
      <Button type="submit" className="w-full md:w-auto">
        Save Profile Information
      </Button>
      
      <DeleteAccount />
    </form>
  );
};

export default GeneralSettings;
