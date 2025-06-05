
import React from 'react';
import { Button } from "@/components/ui/button";

interface CredentialsActionsProps {
  onSave: () => void;
  onDeactivate: () => void;
  isSaving: boolean;
  hasCredentials: boolean;
  canSave: boolean;
}

const CredentialsActions = ({
  onSave,
  onDeactivate,
  isSaving,
  hasCredentials,
  canSave
}: CredentialsActionsProps) => {
  return (
    <div className="flex gap-2">
      <Button 
        onClick={onSave}
        disabled={isSaving || !canSave}
        className="flex-1"
      >
        {isSaving ? "Saving..." : hasCredentials ? "Update Credentials" : "Save Credentials"}
      </Button>
      
      {hasCredentials && (
        <Button 
          variant="destructive"
          onClick={onDeactivate}
          disabled={isSaving}
        >
          {isSaving ? "Deactivating..." : "Deactivate"}
        </Button>
      )}
    </div>
  );
};

export default CredentialsActions;
