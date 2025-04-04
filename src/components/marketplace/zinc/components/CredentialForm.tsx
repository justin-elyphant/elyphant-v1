
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface CredentialFormProps {
  email: string;
  password: string;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  hasStoredCredentials: boolean;
}

const CredentialForm: React.FC<CredentialFormProps> = ({
  email,
  password,
  setEmail,
  setPassword,
  hasStoredCredentials
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
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
  );
};

export default CredentialForm;
