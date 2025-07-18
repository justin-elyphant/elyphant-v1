
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CredentialsForm from "./amazon-credentials/CredentialsForm";
import CredentialsStatus from "./amazon-credentials/CredentialsStatus";
import CredentialsActions from "./amazon-credentials/CredentialsActions";
import AdminNotice from "./amazon-credentials/AdminNotice";

interface ElyphantCredentials {
  email: string;
  is_verified: boolean;
  last_verified_at?: string;
  created_at?: string;
  credential_name?: string;
  notes?: string;
  verification_code?: string;
}

const ElyphantAmazonCredentialsManager = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [credentialName, setCredentialName] = useState('Primary Amazon Business Account');
  const [notes, setNotes] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
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
        setVerificationCode(data.credentials.verification_code || '');
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
          notes: notes,
          verification_code: verificationCode
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success("Elyphant Amazon Business credentials saved successfully");
        await loadCredentials();
        setPassword('');
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
        setVerificationCode('');
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
          <CredentialsStatus credentials={credentials} />
        )}

        <CredentialsForm
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          credentialName={credentialName}
          setCredentialName={setCredentialName}
          notes={notes}
          setNotes={setNotes}
          verificationCode={verificationCode}
          setVerificationCode={setVerificationCode}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          isSaving={isSaving}
        />

        <CredentialsActions
          onSave={handleSave}
          onDeactivate={handleDeactivate}
          isSaving={isSaving}
          hasCredentials={hasCredentials}
          canSave={!!(email && password)}
        />

        <AdminNotice />
      </CardContent>
    </Card>
  );
};

export default ElyphantAmazonCredentialsManager;
