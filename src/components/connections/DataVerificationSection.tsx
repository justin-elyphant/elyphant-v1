import React, { useState } from "react";
import { MapPin, Calendar, Mail, AlertCircle, Shield, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Connection } from "@/types/connections";
import { ConnectionPrivacyControls } from "./ConnectionPrivacyControls";

interface DataVerificationSectionProps {
  friend: Connection;
  onVerificationRequest: (connectionId: string, dataType: keyof Connection['dataStatus']) => void;
}

const DataVerificationSection: React.FC<DataVerificationSectionProps> = ({ friend, onVerificationRequest }) => {
  const [showPrivacyControls, setShowPrivacyControls] = useState(false);
  
  const renderStatusBadgeAndButton = (status: string, dataType: keyof Connection['dataStatus'], icon: React.ReactNode, label: string) => {
    if (status === 'verified') {
      return <Badge variant="outline" className="text-green-500 border-green-500">Verified</Badge>;
    } else if (status === 'blocked') {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-red-500 border-red-500">
            Blocked by {friend.name}
          </Badge>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-blue-500 p-0"
            onClick={() => setShowPrivacyControls(true)}
          >
            <Settings className="h-3 w-3 mr-1" /> Manage
          </Button>
        </div>
      );
    } else {
      return (
        <Button 
          variant="ghost" 
          size="sm" 
          className={`h-6 p-0 ${status === 'missing' ? 'text-red-500' : 'text-amber-500'}`}
          onClick={() => onVerificationRequest(friend.connectionId || friend.id, dataType)}
        >
          <AlertCircle className="h-3 w-3 mr-1" /> 
          {status === 'missing' ? 'Request' : 'Update'}
        </Button>
      );
    }
  };

  const hasUnverifiedData = Object.values(friend.dataStatus).some(status => status !== 'verified');
  const hasBlockedData = Object.values(friend.dataStatus).some(status => status === 'blocked');

  return (
    <>
      <div className="bg-muted p-3 rounded-md mb-3">
        <h4 className="text-sm font-medium mb-2 flex items-center">
          <Shield className="h-4 w-4 mr-1 text-primary" />
          Data Verification
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              <span>Shipping Address:</span>
            </div>
            <div className="flex items-center">
              {renderStatusBadgeAndButton(friend.dataStatus.shipping, 'shipping', <MapPin className="h-3 w-3" />, 'Shipping Address')}
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Birthday:</span>
            </div>
            <div className="flex items-center">
              {renderStatusBadgeAndButton(friend.dataStatus.birthday, 'birthday', <Calendar className="h-3 w-3" />, 'Birthday')}
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              <span>Email:</span>
            </div>
            <div className="flex items-center">
              {renderStatusBadgeAndButton(friend.dataStatus.email, 'email', <Mail className="h-3 w-3" />, 'Email')}
            </div>
          </div>
        </div>
      </div>
      
      {hasUnverifiedData && (
        <Alert variant="destructive" className="mb-2 p-2 text-xs">
          <AlertCircle className="h-3 w-3" />
          <AlertTitle className="text-xs">Auto-gifting unavailable</AlertTitle>
          <AlertDescription className="text-xs">
            {hasBlockedData 
              ? `${friend.name} has blocked access to some data. Manage privacy settings to enable gifting.`
              : 'Complete profile data verification to enable auto-gifting.'
            }
          </AlertDescription>
        </Alert>
      )}

      <ConnectionPrivacyControls
        connection={friend}
        onUpdate={() => window.location.reload()}
        isOpen={showPrivacyControls}
        onClose={() => setShowPrivacyControls(false)}
      />
    </>
  );
};

export default DataVerificationSection;