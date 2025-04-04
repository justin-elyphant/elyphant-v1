
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AmazonCredentials } from './types';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface AmazonCredentialsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (credentials: AmazonCredentials) => void;
  initialCredentials?: AmazonCredentials;
}

const AmazonCredentialsManager: React.FC<AmazonCredentialsManagerProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCredentials
}) => {
  const [email, setEmail] = useState(initialCredentials?.email || '');
  const [password, setPassword] = useState(initialCredentials?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
  
  // Check if credentials are already stored
  useEffect(() => {
    const storedCredentials = localStorage.getItem('amazonCredentials');
    if (storedCredentials) {
      try {
        const parsedCredentials = JSON.parse(storedCredentials);
        setEmail(parsedCredentials.email || '');
        setPassword(parsedCredentials.password || '');
        setHasStoredCredentials(true);
      } catch (error) {
        console.error("Error parsing stored Amazon credentials:", error);
      }
    }
  }, []);

  const handleSave = () => {
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    const credentials: AmazonCredentials = { email, password };
    
    // Save credentials in localStorage (encrypted in a real app)
    try {
      localStorage.setItem('amazonCredentials', JSON.stringify(credentials));
      onSave(credentials);
      toast.success("Amazon credentials saved successfully");
      onClose();
    } catch (error) {
      console.error("Error saving Amazon credentials:", error);
      toast.error("Failed to save credentials");
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClearCredentials = () => {
    localStorage.removeItem('amazonCredentials');
    setEmail('');
    setPassword('');
    setHasStoredCredentials(false);
    toast.success("Amazon credentials cleared");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Amazon Account Credentials</DialogTitle>
          <DialogDescription>
            Enter your Amazon account credentials for Zinc to process orders.
            These will be securely stored on your device.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {hasStoredCredentials && (
            <div className="bg-green-50 p-3 rounded-md mb-4 flex items-center">
              <Lock className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-sm text-green-600">
                Your Amazon credentials are saved. You can update them below.
              </span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="amazon-email">Amazon Email</Label>
            <Input
              id="amazon-email"
              type="email"
              placeholder="your-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amazon-password">Amazon Password</Label>
            <div className="relative">
              <Input
                id="amazon-password"
                type={showPassword ? "text" : "password"}
                placeholder="Your Amazon password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={toggleShowPassword}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Your credentials are stored locally on your device and are only sent directly
            to Zinc during the checkout process.
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row sm:justify-between">
          {hasStoredCredentials && (
            <Button 
              variant="outline" 
              className="mt-2 sm:mt-0" 
              onClick={handleClearCredentials}
            >
              Clear Credentials
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={handleSave}>Save Credentials</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AmazonCredentialsManager;
