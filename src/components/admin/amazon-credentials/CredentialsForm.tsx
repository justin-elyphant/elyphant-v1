
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface CredentialsFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  credentialName: string;
  setCredentialName: (name: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  isSaving: boolean;
}

const CredentialsForm = ({
  email,
  setEmail,
  password,
  setPassword,
  credentialName,
  setCredentialName,
  notes,
  setNotes,
  showPassword,
  setShowPassword,
  isSaving
}: CredentialsFormProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="credential-name">Account Name</Label>
        <Input
          id="credential-name"
          type="text"
          value={credentialName}
          onChange={(e) => setCredentialName(e.target.value)}
          placeholder="Primary Amazon Business Account"
          disabled={isSaving}
        />
      </div>

      <div>
        <Label htmlFor="amazon-email">Amazon Business Email</Label>
        <Input
          id="amazon-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="business@elyphant.com"
          disabled={isSaving}
        />
      </div>

      <div>
        <Label htmlFor="amazon-password">Amazon Business Password</Label>
        <div className="relative">
          <Input
            id="amazon-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password to update"
            disabled={isSaving}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isSaving}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes about this account..."
          disabled={isSaving}
          rows={3}
        />
      </div>
    </div>
  );
};

export default CredentialsForm;
