
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, Info } from 'lucide-react';
import { AmazonCredentials } from './types';
import { useAmazonCredentials } from './hooks/useAmazonCredentials';
import CredentialForm from './components/CredentialForm';
import CredentialFooter from './components/CredentialFooter';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AmazonCredentialsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (credentials: AmazonCredentials) => void;
}

const AmazonCredentialsManager: React.FC<AmazonCredentialsManagerProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    hasStoredCredentials,
    handleSave,
    handleClearCredentials
  } = useAmazonCredentials();

  const handleSaveAndClose = () => {
    const success = handleSave();
    if (success) {
      onSave({ email, password });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Amazon Business Credentials</DialogTitle>
          <DialogDescription>
            Enter your Amazon Business account credentials for Zinc to process orders.
            These will be securely stored on your device.
          </DialogDescription>
        </DialogHeader>
        
        <Alert className="bg-blue-50 border-blue-200 my-2">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Zinc will use these credentials to place orders in your Amazon Business environment.
          </AlertDescription>
        </Alert>
        
        <CredentialForm 
          email={email}
          password={password}
          setEmail={setEmail}
          setPassword={setPassword}
          hasStoredCredentials={hasStoredCredentials}
        />
        
        <DialogFooter>
          <CredentialFooter 
            onClose={onClose}
            onSave={handleSaveAndClose}
            hasStoredCredentials={hasStoredCredentials}
            onClearCredentials={handleClearCredentials}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AmazonCredentialsManager;
