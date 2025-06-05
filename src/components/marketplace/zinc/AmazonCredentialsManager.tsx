
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AmazonCredentials {
  email: string;
  is_verified: boolean;
  last_verified_at?: string;
  created_at?: string;
}

const AmazonCredentialsManager = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [credentials, setCredentials] = useState<AmazonCredentials | null>(null);
  const [hasCredentials, setHasCredentials] = useState(false);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-amazon-credentials', {
        body: { action: 'get' }
      });

      if (error) {
        throw error;
      }

      if (data.success && data.credentials) {
        setCredentials(data.credentials);
        setEmail(data.credentials.email);
        setHasCredentials(true);
      } else {
        setHasCredentials(false);
      }
    } catch (error) {
      console.error("Error loading credentials:", error);
      toast.error("Failed to load Amazon Business credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-amazon-credentials', {
        body: {
          action: 'save',
          email: email,
          password: password
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success("Amazon Business credentials saved successfully");
        await loadCredentials(); // Reload to get updated status
        setPassword(''); // Clear password field after saving
      } else {
        throw new Error('Failed to save credentials');
      }
    } catch (error) {
      console.error("Error saving credentials:", error);
      toast.error("Failed to save Amazon Business credentials");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-amazon-credentials', {
        body: { action: 'delete' }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success("Amazon Business credentials removed successfully");
        setCredentials(null);
        setHasCredentials(false);
        setEmail('');
        setPassword('');
      } else {
        throw new Error('Failed to delete credentials');
      }
    } catch (error) {
      console.error("Error deleting credentials:", error);
      toast.error("Failed to remove Amazon Business credentials");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Amazon Business Credentials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading credentials...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Amazon Business Credentials
        </CardTitle>
        <CardDescription>
          Securely store your Amazon Business account credentials for automatic order fulfillment.
          Your credentials are encrypted and stored securely on our servers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasCredentials && credentials && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {credentials.is_verified ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              <span className="font-medium">
                {credentials.is_verified ? 'Verified Account' : 'Unverified Account'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Email: {credentials.email}
            </p>
            {credentials.last_verified_at && (
              <p className="text-xs text-gray-500">
                Last verified: {new Date(credentials.last_verified_at).toLocaleDateString()}
              </p>
            )}
            {!credentials.is_verified && (
              <p className="text-xs text-yellow-600 mt-2">
                Credentials will be verified on your first successful order
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="amazon-email">Amazon Business Email</Label>
            <Input
              id="amazon-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-business@company.com"
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
                placeholder={hasCredentials ? "Enter new password to update" : "Enter your password"}
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

          <div className="flex gap-2">
            <Button 
              onClick={handleSave}
              disabled={isSaving || !email || !password}
              className="flex-1"
            >
              {isSaving ? "Saving..." : hasCredentials ? "Update Credentials" : "Save Credentials"}
            </Button>
            
            {hasCredentials && (
              <Button 
                variant="destructive"
                onClick={handleDelete}
                disabled={isSaving}
              >
                {isSaving ? "Removing..." : "Remove"}
              </Button>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
          <p className="font-medium mb-1">Security Notice:</p>
          <p>
            Your Amazon Business credentials are encrypted and stored securely. 
            They are only used for order fulfillment and are never shared with third parties.
            We recommend using a dedicated Amazon Business account for automated ordering.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AmazonCredentialsManager;
