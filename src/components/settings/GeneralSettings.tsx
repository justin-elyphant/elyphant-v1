import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { toast } from "sonner";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import ProfileImageUpload from "./ProfileImageUpload";
import AddressAutocomplete from "./AddressAutocomplete";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/supabase";

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
      <div className="flex justify-center mb-6">
        <ProfileImageUpload 
          currentImage={formData.profile_image} 
          name={formData.name} 
          onImageUpdate={handleProfileImageUpdate} 
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
            />
          </div>
        
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              disabled={!!user}
            />
          </div>
        
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input 
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="username"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="birthday">Birthday</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.birthday && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.birthday ? (
                    format(formData.birthday, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.birthday}
                  onSelect={handleBirthdayChange}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself"
              rows={3}
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Shipping Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <AddressAutocomplete
              value={formData.address.street}
              onChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  address: {
                    ...prev.address,
                    street: value
                  }
                }));
              }}
              onAddressSelect={handleAddressAutocomplete}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input 
              id="city"
              name="address.city"
              value={formData.address.city}
              onChange={handleChange}
              placeholder="New York"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state">State/Province</Label>
            <Input 
              id="state"
              name="address.state"
              value={formData.address.state}
              onChange={handleChange}
              placeholder="NY"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="zipCode">Postal/Zip Code</Label>
            <Input 
              id="zipCode"
              name="address.zipCode"
              value={formData.address.zipCode}
              onChange={handleChange}
              placeholder="10001"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input 
              id="country"
              name="address.country"
              value={formData.address.country}
              onChange={handleChange}
              placeholder="United States"
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Interests</h3>
        <p className="text-sm text-muted-foreground">Add your interests to help connections find better gifts for you</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {formData.interests.map((interest, index) => (
            <div 
              key={index} 
              className="bg-muted px-3 py-1 rounded-full flex items-center gap-1"
            >
              <span>{interest}</span>
              <button 
                type="button" 
                onClick={() => removeInterest(index)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Input
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            placeholder="Add an interest (e.g., Photography, Hiking)"
            className="flex-1"
          />
          <Button 
            type="button" 
            onClick={addInterest}
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Important Dates</h3>
        <p className="text-sm text-muted-foreground">Add important dates for gift reminders</p>
        
        <div className="space-y-3 mb-4">
          {formData.importantDates.map((date, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between bg-muted p-3 rounded-md"
            >
              <div>
                <p className="font-medium">{format(new Date(date.date), "PPP")}</p>
                <p className="text-sm text-muted-foreground">{date.description}</p>
              </div>
              <button 
                type="button" 
                onClick={() => removeImportantDate(index)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newImportantDate.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newImportantDate.date ? (
                    format(newImportantDate.date, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={newImportantDate.date}
                  onSelect={(date) => setNewImportantDate(prev => ({ ...prev, date }))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="md:col-span-2 flex gap-2">
            <Input
              value={newImportantDate.description}
              onChange={(e) => setNewImportantDate(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description (e.g., Anniversary, Graduation)"
              className="flex-1"
            />
            <Button 
              type="button" 
              onClick={addImportantDate}
              variant="outline"
              disabled={!newImportantDate.date || !newImportantDate.description}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>
      
      <Button type="submit" className="w-full md:w-auto">
        Save Profile Information
      </Button>
    </form>
  );
};

export default GeneralSettings;
