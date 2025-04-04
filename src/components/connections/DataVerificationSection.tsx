
import React from "react";
import { MapPin, Calendar, Mail, AlertCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Connection } from "@/types/connections";

interface DataVerificationSectionProps {
  friend: Connection;
  onVerificationRequest: (connectionId: string, dataType: keyof Connection['dataStatus']) => void;
}

const DataVerificationSection: React.FC<DataVerificationSectionProps> = ({ friend, onVerificationRequest }) => {
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
              {friend.dataStatus.shipping === 'verified' ? (
                <Badge variant="outline" className="text-green-500 border-green-500">Verified</Badge>
              ) : friend.dataStatus.shipping === 'missing' ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-red-500 p-0"
                  onClick={() => onVerificationRequest(friend.id, 'shipping')}
                >
                  <AlertCircle className="h-3 w-3 mr-1" /> Request
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-amber-500 p-0"
                  onClick={() => onVerificationRequest(friend.id, 'shipping')}
                >
                  <AlertCircle className="h-3 w-3 mr-1" /> Update
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Birthday:</span>
            </div>
            <div className="flex items-center">
              {friend.dataStatus.birthday === 'verified' ? (
                <Badge variant="outline" className="text-green-500 border-green-500">Verified</Badge>
              ) : friend.dataStatus.birthday === 'missing' ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-red-500 p-0"
                  onClick={() => onVerificationRequest(friend.id, 'birthday')}
                >
                  <AlertCircle className="h-3 w-3 mr-1" /> Request
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-amber-500 p-0"
                  onClick={() => onVerificationRequest(friend.id, 'birthday')}
                >
                  <AlertCircle className="h-3 w-3 mr-1" /> Update
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              <span>Email:</span>
            </div>
            <div className="flex items-center">
              {friend.dataStatus.email === 'verified' ? (
                <Badge variant="outline" className="text-green-500 border-green-500">Verified</Badge>
              ) : friend.dataStatus.email === 'missing' ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-red-500 p-0"
                  onClick={() => onVerificationRequest(friend.id, 'email')}
                >
                  <AlertCircle className="h-3 w-3 mr-1" /> Request
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-amber-500 p-0"
                  onClick={() => onVerificationRequest(friend.id, 'email')}
                >
                  <AlertCircle className="h-3 w-3 mr-1" /> Update
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {(friend.dataStatus.shipping !== 'verified' || 
        friend.dataStatus.birthday !== 'verified' || 
        friend.dataStatus.email !== 'verified') && (
        <Alert variant="destructive" className="mb-2 p-2 text-xs">
          <AlertCircle className="h-3 w-3" />
          <AlertTitle className="text-xs">Auto-gifting unavailable</AlertTitle>
          <AlertDescription className="text-xs">
            Complete profile data to enable auto-gifting.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default DataVerificationSection;
