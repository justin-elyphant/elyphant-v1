
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ProfileCreationService, ProfileCreationData } from "@/services/profile/profileCreationService";
import { mapOAuthToProfileCreationData, validateProfileCreationData } from "@/utils/profileCreationDataMapper";

const OAuthProfileCompletion = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    bio: ""
  });

  console.log("🔄 OAuthProfileCompletion component mounted");
  console.log("👤 Current user:", user?.id);

  useEffect(() => {
    if (!user) {
      console.log("❌ No user found, redirecting to sign-in");
      navigate("/auth/signin");
      return;
    }

    console.log("📊 Processing OAuth user metadata:", user.user_metadata);
    
    // Extract OAuth data and pre-populate form
    const metadata = user.user_metadata || {};
    const firstName = metadata.first_name || metadata.given_name || "";
    const lastName = metadata.last_name || metadata.family_name || "";
    const fullName = metadata.full_name || metadata.name || "";
    
    // If we have a full name but no separate first/last, try to split
    let extractedFirstName = firstName;
    let extractedLastName = lastName;
    
    if (!firstName && !lastName && fullName) {
      const nameParts = fullName.split(' ');
      extractedFirstName = nameParts[0] || "";
      extractedLastName = nameParts.slice(1).join(' ') || "";
    }

    console.log("📝 Extracted names:", { 
      firstName: extractedFirstName, 
      lastName: extractedLastName,
      email: user.email 
    });

    setFormData({
      first_name: extractedFirstName,
      last_name: extractedLastName,
      username: `user_${user.id.substring(0, 8)}`,
      bio: ""
    });
  }, [user, navigate]);

  const handleInputChange = (field: string, value: string) => {
    console.log(`📝 Form field updated: ${field} = ${value}`);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCompleteProfile = async () => {
    if (!user) {
      console.error("❌ No user available for profile completion");
      toast.error("Authentication error. Please try signing in again.");
      return;
    }

    console.log("🚀 Starting OAuth profile completion...");
    console.log("📊 Form data:", formData);

    setIsLoading(true);

    try {
      // Use the mapper utility to create consistent profile data
      const profileData = mapOAuthToProfileCreationData(user, formData);
      
      // Validate the data
      const validationErrors = validateProfileCreationData(profileData);
      if (validationErrors.length > 0) {
        console.log("❌ Validation failed:", validationErrors);
        toast.error(validationErrors[0]);
        setIsLoading(false);
        return;
      }

      console.log("📋 Complete profile data prepared:", JSON.stringify(profileData, null, 2));

      // Use enhanced profile creation service
      const result = await ProfileCreationService.createEnhancedProfile(user.id, profileData);

      if (result.success) {
        console.log("✅ OAuth profile completion successful!");
        toast.success("Profile completed successfully!");
        
        // Navigate to dashboard
        navigate("/dashboard");
      } else {
        console.error("❌ OAuth profile completion failed:", result.error);
        toast.error(result.error || "Failed to complete profile. Please try again.");
      }
    } catch (error: any) {
      console.error("❌ Unexpected error during OAuth profile completion:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Complete Your Profile</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Just a few more details to get you started
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              type="text"
              value={formData.first_name}
              onChange={(e) => handleInputChange("first_name", e.target.value)}
              placeholder="Enter your first name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              type="text"
              value={formData.last_name}
              onChange={(e) => handleInputChange("last_name", e.target.value)}
              placeholder="Enter your last name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              placeholder="Choose a username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio (Optional)</Label>
            <Input
              id="bio"
              type="text"
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              placeholder="Tell us about yourself"
            />
          </div>

          <Button
            onClick={handleCompleteProfile}
            disabled={isLoading || !formData.first_name.trim() || !formData.last_name.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing Profile...
              </>
            ) : (
              "Complete Profile"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthProfileCompletion;
