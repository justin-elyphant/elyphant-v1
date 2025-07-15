import React from 'react';
import { useAuth } from '@/contexts/auth';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Camera, User, Mail, Calendar, Hash, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CompletionField {
  id: string;
  label: string;
  icon: React.ReactNode;
  isComplete: boolean;
  isRequired: boolean;
  settingsTab?: string;
}

// Helper function to validate shipping address completeness
const validateShippingAddress = (shippingAddress: any): boolean => {
  if (!shippingAddress || typeof shippingAddress !== 'object') return false;
  
  const requiredFields = ['address_line1', 'city', 'state', 'zip_code', 'country'];
  return requiredFields.every(field => 
    shippingAddress[field] && 
    typeof shippingAddress[field] === 'string' && 
    shippingAddress[field].trim().length > 0
  );
};

const ProfileCompletionProgress: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  if (!profile) return null;

  const completionFields: CompletionField[] = [
    {
      id: 'first_name',
      label: 'First Name',
      icon: <User className="w-4 h-4" />,
      isComplete: !!(profile as any).first_name?.trim(),
      isRequired: true,
      settingsTab: 'basic'
    },
    {
      id: 'last_name',
      label: 'Last Name',
      icon: <User className="w-4 h-4" />,
      isComplete: !!(profile as any).last_name?.trim(),
      isRequired: true,
      settingsTab: 'basic'
    },
    {
      id: 'email',
      label: 'Email',
      icon: <Mail className="w-4 h-4" />,
      isComplete: !!profile.email?.trim(),
      isRequired: true,
      settingsTab: 'basic'
    },
    {
      id: 'profile_image',
      label: 'Profile Photo',
      icon: <Camera className="w-4 h-4" />,
      isComplete: !!profile.profile_image,
      isRequired: true,
      settingsTab: 'basic'
    },
    {
      id: 'username',
      label: 'Username',
      icon: <Hash className="w-4 h-4" />,
      isComplete: !!profile.username?.trim() && profile.username.length >= 3,
      isRequired: true,
      settingsTab: 'basic'
    },
    {
      id: 'birth_year',
      label: 'Birth Year',
      icon: <Calendar className="w-4 h-4" />,
      isComplete: !!(profile as any).birth_year && (profile as any).birth_year >= 1900 && (profile as any).birth_year <= new Date().getFullYear(),
      isRequired: true,
      settingsTab: 'basic'
    },
    {
      id: 'dob',
      label: 'Date of Birth',
      icon: <Calendar className="w-4 h-4" />,
      isComplete: !!profile.dob,
      isRequired: true,
      settingsTab: 'basic'
    },
    {
      id: 'shipping_address',
      label: 'Shipping Address',
      icon: <MapPin className="w-4 h-4" />,
      isComplete: validateShippingAddress(profile.shipping_address),
      isRequired: true,
      settingsTab: 'address'
    }
  ];

  const requiredFields = completionFields.filter(field => field.isRequired);
  const completedRequired = requiredFields.filter(field => field.isComplete).length;
  const completionPercentage = Math.round((completedRequired / requiredFields.length) * 100);
  
  const incompleteRequiredFields = requiredFields.filter(field => !field.isComplete);
  const isProfileComplete = incompleteRequiredFields.length === 0;

  const handleFieldClick = (field: CompletionField) => {
    if (field.settingsTab) {
      navigate(`/settings?tab=general`, {
        state: { 
          fromDataIntegrity: true, 
          activeTab: field.settingsTab,
          focusField: field.id
        }
      });
    }
  };

  if (isProfileComplete) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            Profile Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700">
            All required profile fields are completed. Your profile is ready for enhanced AI recommendations!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <AlertCircle className="w-5 h-5" />
          Complete Your Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-amber-700">Progress</span>
            <span className="text-amber-700 font-medium">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-amber-700 font-medium">
            Missing Required Fields ({incompleteRequiredFields.length}):
          </p>
          <div className="grid grid-cols-1 gap-2">
            {incompleteRequiredFields.map((field) => (
              <Button
                key={field.id}
                variant="outline"
                size="sm"
                onClick={() => handleFieldClick(field)}
                className={cn(
                  "justify-start h-auto p-3 border-amber-300 bg-white hover:bg-amber-100 hover:border-amber-400",
                  "text-amber-800 hover:text-amber-900"
                )}
              >
                <div className="flex items-center gap-2 w-full">
                  {field.icon}
                  <span className="text-sm font-medium">{field.label}</span>
                  <AlertCircle className="w-3 h-3 ml-auto text-amber-600" />
                </div>
              </Button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-amber-200">
          <p className="text-xs text-amber-600">
            Complete your profile to unlock personalized AI gift recommendations and enhanced user matching.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionProgress;