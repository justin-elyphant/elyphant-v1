
import React from 'react';
import { Button } from "@/components/ui/button";

interface CredentialFooterProps {
  onClose: () => void;
  onSave: () => void;
  hasStoredCredentials: boolean;
  onClearCredentials: () => void;
}

const CredentialFooter: React.FC<CredentialFooterProps> = ({
  onClose,
  onSave,
  hasStoredCredentials,
  onClearCredentials
}) => {
  return (
    <div className="flex-col sm:flex-row sm:justify-between">
      {hasStoredCredentials && (
        <Button 
          variant="outline" 
          className="mt-2 sm:mt-0" 
          onClick={onClearCredentials}
        >
          Clear Credentials
        </Button>
      )}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" onClick={onSave}>Save Credentials</Button>
      </div>
    </div>
  );
};

export default CredentialFooter;
