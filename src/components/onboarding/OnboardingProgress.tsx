import React from "react";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/hooks/profile/useProfile";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, User, Mail, Camera, Calendar, MapPin } from "lucide-react";

// Helper function to validate shipping address completeness
const validateShippingAddress = (shippingAddress: any): boolean => {
  console.log("🔍 [OnboardingProgress] Validating shipping address:", JSON.stringify(shippingAddress, null, 2));
  
  if (!shippingAddress || typeof shippingAddress !== 'object') {
    console.log("❌ [OnboardingProgress] No shipping address or invalid type");
    return false;
  }
  
  // Check if we have individual fields (ideal case)
  const hasIndividualFields = !!(shippingAddress.address_line1 && 
                                shippingAddress.city && 
                                shippingAddress.state && 
                                shippingAddress.zip_code && 
                                shippingAddress.country);
  
  // Check if we have formatted address (current incomplete case)
  const hasFormattedAddress = !!(shippingAddress.formatted_address && 
                                shippingAddress.formatted_address.trim().length > 10);
  
  const isComplete = hasIndividualFields || hasFormattedAddress;
  console.log("🔍 [OnboardingProgress] Address validation result:", {
    hasIndividualFields,
    hasFormattedAddress,
    isComplete,
    formatted_address_length: shippingAddress.formatted_address?.length || 0
  });
  
  return isComplete;
};

interface OnboardingProgressProps {
  showHeader?: boolean;
  className?: string;
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ 
  showHeader = true, 
  className = "" 
}) => {
  const { user } = useAuth();
  const { profile } = useProfile();

  if (!user || !profile) return null;

  // Check completion of mandatory fields
  const checks = [
    {
      key: 'first_name',
      label: 'First Name',
      icon: User,
      completed: !!profile.first_name && profile.first_name.length > 0,
    },
    {
      key: 'last_name',
      label: 'Last Name', 
      icon: User,
      completed: !!profile.last_name && profile.last_name.length > 0,
    },
    {
      key: 'email',
      label: 'Email',
      icon: Mail,
      completed: !!profile.email && profile.email.includes('@'),
    },
    {
      key: 'username',
      label: 'Username',
      icon: User,
      completed: !!profile.username && profile.username.length >= 3,
    },
    {
      key: 'profile_image',
      label: 'Profile Photo',
      icon: Camera,
      completed: !!profile.profile_image,
    },
    {
      key: 'birth_year',
      label: 'Birth Year',
      icon: Calendar,
      completed: !!profile.birth_year && profile.birth_year >= 1900,
    },
    {
      key: 'dob',
      label: 'Date of Birth',
      icon: Calendar,
      completed: !!profile.dob,
    },
    {
      key: 'shipping_address',
      label: 'Shipping Address',
      icon: MapPin,
      completed: validateShippingAddress(profile.shipping_address),
    },
  ];

  const completedCount = checks.filter(check => check.completed).length;
  const progressPercentage = (completedCount / checks.length) * 100;
  const isComplete = completedCount === checks.length;

  return (
    <div className={`bg-white rounded-lg border shadow-sm p-6 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Profile Completion</h3>
            <p className="text-sm text-muted-foreground">
              Complete your profile to unlock all features
            </p>
          </div>
          <Badge variant={isComplete ? "default" : "secondary"}>
            {completedCount}/{checks.length}
          </Badge>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Progress value={progressPercentage} className="flex-1" />
          <span className="text-sm text-muted-foreground min-w-[3rem]">
            {Math.round(progressPercentage)}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {checks.map((check) => {
            const Icon = check.icon;
            return (
              <div 
                key={check.key}
                className={`flex items-center gap-2 p-2 rounded-md ${
                  check.completed 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-gray-50 text-gray-600'
                }`}
              >
                {check.completed ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                )}
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{check.label}</span>
              </div>
            );
          })}
        </div>

        {!isComplete && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Complete your profile</strong> to access AI gift recommendations, 
              marketplace features, and connect with friends.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingProgress;