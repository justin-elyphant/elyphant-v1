
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CredentialsForm from "./amazon-credentials/CredentialsForm";
import CredentialsStatus from "./amazon-credentials/CredentialsStatus";
import CredentialsActions from "./amazon-credentials/CredentialsActions";
import AdminNotice from "./amazon-credentials/AdminNotice";
import { usePerformanceMonitor } from "@/utils/performanceMonitoring";

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
  const { trackAsyncOperation } = usePerformanceMonitor();

  useEffect(() => {
    // Delay loading credentials slightly to improve initial page render
    const timer = setTimeout(() => {
      loadCredentials();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const loadCredentials = async () => {
    setIsLoading(true);
    try {
      const credentials = await trackAsyncOperation('load-amazon-credentials', async () => {
        const { data, error } = await supabase.functions.invoke('manage-amazon-credentials', {
          body: { action: 'get' }
        });

        if (error) {
          throw error;
        }

        return data;
      });

      if (credentials.success && credentials.credentials) {
        setCredentials(credentials.credentials);
        setEmail(credentials.credentials.email);
        setCredentialName(credentials.credentials.credential_name || 'Primary Amazon Business Account');
        setNotes(credentials.credentials.notes || '');
        setVerificationCode(credentials.credentials.verification_code || '');
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
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    if (!hasCredentials && !password) {
      toast.error("Please enter a password for new credentials");
      return;
    }

    setIsSaving(true);
    try {
      const result = await trackAsyncOperation('save-amazon-credentials', async () => {
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

        return data;
      });

      if (result.success) {
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
      const result = await trackAsyncOperation('deactivate-amazon-credentials', async () => {
        const { data, error } = await supabase.functions.invoke('manage-amazon-credentials', {
          body: { action: 'delete' }
        });

        if (error) {
          throw error;
        }

        return data;
      });

      if (result.success) {
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
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
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
          canSave={hasCredentials ? !!email : !!(email && password)}
        />

        <AdminNotice />
      </CardContent>
    </Card>
  );
};

export default ElyphantAmazonCredentialsManager;
