
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { toast } from "sonner";

const GeneralSettings = () => {
  const [userData, setUserData] = useLocalStorage("userData", null);
  const [formData, setFormData] = useState({
    name: userData?.name || "",
    email: userData?.email || "",
    username: userData?.username || ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update the user data
    setUserData({
      ...userData,
      name: formData.name,
      email: formData.email,
      username: formData.username
    });
    
    toast.success("Profile information updated successfully");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
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
      </div>
      
      <Button type="submit" className="w-full md:w-auto">
        Save Profile Information
      </Button>
    </form>
  );
};

export default GeneralSettings;
