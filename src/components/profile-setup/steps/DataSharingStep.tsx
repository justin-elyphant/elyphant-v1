import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataSharingSettings, SharingLevel } from "@/types/supabase";
import { Shield, Calendar, MapPin, Gift, Mail, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getDefaultSharingLevel } from "@/utils/privacyUtils";

interface DataSharingStepProps {
  values: DataSharingSettings;
  onChange: (settings: DataSharingSettings) => void;
}

const DataSharingStep: React.FC<DataSharingStepProps> = ({ values, onChange }) => {
  const handleChange = (field: keyof DataSharingSettings, value: SharingLevel) => {
    onChange({
      ...values,
      [field]: value
    });
  };

  // Ensure we have all default values
  React.useEffect(() => {
    const updatedValues = { ...values };
    let needsUpdate = false;
    
    // Set defaults for any missing fields
    if (!updatedValues.dob) {
      updatedValues.dob = getDefaultSharingLevel('dob');
      needsUpdate = true;
    }
    
    if (!updatedValues.shipping_address) {
      updatedValues.shipping_address = getDefaultSharingLevel('shipping_address');
      needsUpdate = true;
    }
    
    if (!updatedValues.gift_preferences) {
      updatedValues.gift_preferences = getDefaultSharingLevel('gift_preferences');
      needsUpdate = true;
    }
    
    if (!updatedValues.email) {
      updatedValues.email = getDefaultSharingLevel('email');
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      onChange(updatedValues);
    }
  }, [values, onChange]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Privacy Settings</h3>
        <p className="text-sm text-muted-foreground">
          Control who can see your personal information
        </p>
      </div>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <Label className="text-base">Birthday</Label>
              <p className="text-sm text-muted-foreground">Who can see your birthday</p>
            </div>
          </div>
          <div className="w-32">
            <Select 
              value={values.dob} 
              onValueChange={(val) => handleChange('dob', val as SharingLevel)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Everyone</SelectItem>
                <SelectItem value="friends">Friends Only</SelectItem>
                <SelectItem value="private">Only Me</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-3">
            <MapPin className="h-5 w-5 text-red-500" />
            <div>
              <Label className="text-base">Shipping Address</Label>
              <p className="text-sm text-muted-foreground">Who can see your address</p>
            </div>
          </div>
          <div className="w-32">
            <Select 
              value="friends" 
              disabled={true}
              onValueChange={(val) => handleChange('shipping_address', val as SharingLevel)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Friends Only" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friends">Friends Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Alert className="bg-blue-50 border-blue-200 mt-2">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm text-blue-700">
            Your shipping address is only shared with your friends to enable gift giving features.
          </AlertDescription>
        </Alert>
        
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-3">
            <Gift className="h-5 w-5 text-purple-500" />
            <div>
              <Label className="text-base">Gift Preferences</Label>
              <p className="text-sm text-muted-foreground">Who can see your gift preferences</p>
            </div>
          </div>
          <div className="w-32">
            <Select 
              value={values.gift_preferences} 
              onValueChange={(val) => handleChange('gift_preferences', val as SharingLevel)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Everyone</SelectItem>
                <SelectItem value="friends">Friends Only</SelectItem>
                <SelectItem value="private">Only Me</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-blue-700" />
            <div>
              <Label className="text-base">Email Address</Label>
              <p className="text-sm text-muted-foreground">Who can see your email</p>
            </div>
          </div>
          <div className="w-32">
            <Select 
              value={values.email} 
              onValueChange={(val) => handleChange('email', val as SharingLevel)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friends">Friends Only</SelectItem>
                <SelectItem value="private">Only Me</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-muted rounded-lg flex items-start space-x-3">
        <Shield className="h-5 w-5 text-green-500 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">Your privacy is important</p>
          <p className="text-muted-foreground mt-1">
            You can change these settings any time from your profile settings. 
            We never share your personal information with third parties without your explicit consent.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataSharingStep;
