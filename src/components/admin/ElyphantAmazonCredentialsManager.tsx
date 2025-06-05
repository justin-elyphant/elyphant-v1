
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Eye, EyeOff, Shield, CheckCircle, AlertCircle, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ElyphantCredentials {
  email: string;
  is_verified: boolean;
  last_verified_at?: string;
  created_at?: string;
  credential_name?: string;
  notes?: string;
}

const ElyphantAmazonCredentialsManager = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [credentialName, setCredentialName] = useState('Primary Amazon Business Account');
  const [notes, setNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [credentials, setCredentials] = useState<ElyphantCredentials | null>(null);
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
        setCredentialName(data.credentials.credential_name || 'Primary Amazon Business Account');
        setNotes(data.credentials.notes || '');
        setHasCredentials(true);
      } else {
        setHasCredentials(false);
      }
    } catch (error) {
      console.error("Error loading Elyphant credentials:", error);
      toast.error("Failed to load Elyphant Amazon Business credentials");
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
          password: password,
          credential_name: credentialName,
          notes: notes
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success("Elyphant Amazon Business credentials saved successfully");
        await loadCredentials(); // Reload to get updated status
        setPassword(''); // Clear password field after saving
      } else {
        throw new Error('Failed to save credentials');
      }
    } catch (error) {
      console.error("Error saving credentials:", error);
      toast.error("Failed to save Elyphant Amazon Business credentials");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-amazon-credentials', {
        body: { action: 'delete' }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success("Elyphant Amazon Business credentials deactivated successfully");
        setCredentials(null);
        setHasCredentials(false);
        setEmail('');
        setPassword('');
        setCredentialName('Primary Amazon Business Account');
        setNotes('');
      } else {
        throw new Error('Failed to deactivate credentials');
      }
    } catch (error) {
      console.error("Error deactivating credentials:", error);
      toast.error("Failed to deactivate Elyphant Amazon Business credentials");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Elyphant Amazon Business Credentials
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
          <Settings className="h-5 w-5" />
          Elyphant Amazon Business Credentials
        </CardTitle>
        <CardDescription>
          Manage Elyphant's centralized Amazon Business account credentials used for all customer order fulfillment.
          These credentials are shared across all customer orders and are not visible to shoppers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasCredentials && credentials && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
            <p className="text-sm text-gray-600 mb-2">
              Account: {credentials.credential_name}
            </p>
            {credentials.last_verified_at && (
              <p className="text-xs text-gray-500">
                Last verified: {new Date(credentials.last_verified_at).toLocaleDateString()}
              </p>
            )}
            {!credentials.is_verified && (
              <p className="text-xs text-yellow-600 mt-2">
                Credentials will be verified on the next successful order
              </p>
            )}
          </div>
        )}

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
                placeholder={hasCredentials ? "Enter new password to update" : "Enter password"}
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
                onClick={handleDeactivate}
                disabled={isSaving}
              >
                {isSaving ? "Deactivating..." : "Deactivate"}
              </Button>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-amber-50 p-3 rounded-lg">
          <p className="font-medium mb-1">Admin Notice:</p>
          <p>
            These are Elyphant's centralized Amazon Business credentials used for all customer orders.
            Customers do not need their own Amazon accounts - they simply place orders through our platform
            and we fulfill them using this account. Keep these credentials secure and up-to-date.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ElyphantAmazonCredentialsManager;
