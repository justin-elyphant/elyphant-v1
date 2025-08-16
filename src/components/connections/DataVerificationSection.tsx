import React from "react";
import { MapPin, Calendar, Mail, AlertCircle, Shield, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Connection } from "@/types/connections";
import { useNavigate } from "react-router-dom";

interface DataVerificationSectionProps {
  friend: Connection;
  onVerificationRequest: (connectionId: string, dataType: keyof Connection['dataStatus']) => void;
}

const DataVerificationSection: React.FC<DataVerificationSectionProps> = ({ friend, onVerificationRequest }) => {
  const navigate = useNavigate();
  
  const renderStatusBadgeAndButton = (status: string, dataType: keyof Connection['dataStatus'], icon: React.ReactNode, label: string) => {
    if (status === 'verified') {
      return <Badge variant="outline" className="text-green-500 border-green-500">Sharing</Badge>;
    } else if (status === 'blocked') {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-white bg-destructive border-destructive min-w-0 flex-shrink-0">
            Not Sharing
          </Badge>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-blue-500 p-0"
            onClick={() => navigate(`/connection/${friend.id}`)}
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
          {status === 'missing' ? 'Start Sharing' : 'Update'}
        </Button>
      );
    }
  };

  const hasUnverifiedData = Object.values(friend.dataStatus).some(status => status !== 'verified');
  const hasBlockedData = Object.values(friend.dataStatus).some(status => status === 'blocked');

  return (
    <>
      <div className="bg-muted p-3 rounded-md mb-3">
        <h4 className="text-sm font-medium mb-1 flex items-center">
          <Shield className="h-4 w-4 mr-1 text-primary" />
          Data Sharing with {friend.name}
        </h4>
        <p className="text-xs text-muted-foreground mb-2">Control what information you're sharing for gifting</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              <span>My Shipping Address:</span>
            </div>
            <div className="flex items-center">
              {renderStatusBadgeAndButton(friend.dataStatus.shipping, 'shipping', <MapPin className="h-3 w-3" />, 'Shipping Address')}
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>My Birthday:</span>
            </div>
            <div className="flex items-center">
              {renderStatusBadgeAndButton(friend.dataStatus.birthday, 'birthday', <Calendar className="h-3 w-3" />, 'Birthday')}
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              <span>My Email Address:</span>
            </div>
            <div className="flex items-center">
              {renderStatusBadgeAndButton(friend.dataStatus.email, 'email', <Mail className="h-3 w-3" />, 'Email')}
            </div>
          </div>
        </div>
      </div>
      
      {hasUnverifiedData && (
        <Alert variant="info" className="mb-2 p-2 text-xs">
          <AlertCircle className="h-3 w-3" />
          <AlertTitle className="text-xs">Help {friend.name} send you perfect gifts!</AlertTitle>
          <AlertDescription className="text-xs">
            Share your details so {friend.name} can send you gifts you'll love! Complete your sharing settings to help them choose the perfect presents.
          </AlertDescription>
        </Alert>
      )}

    </>
  );
};

export default DataVerificationSection;