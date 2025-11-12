import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { EnhancedConnection } from '@/hooks/profile/useEnhancedConnections';
import { supabase } from '@/integrations/supabase/client';

interface AddressVerificationWarningProps {
  recipientId: string;
  connections: EnhancedConnection[];
  pendingInvitations: EnhancedConnection[];
}

const AddressVerificationWarning: React.FC<AddressVerificationWarningProps> = ({
  recipientId,
  connections,
  pendingInvitations
}) => {
  const [verificationStatus, setVerificationStatus] = useState<{
    verified: boolean;
    connectionName: string;
    isPending: boolean;
  } | null>(null);

  useEffect(() => {
    const checkVerification = async () => {
      // First check connections array
      let connection = connections.find(c => 
        c.id === recipientId || 
        c.connected_user_id === recipientId
      );

      // Check pending invitations if not found
      if (!connection) {
        connection = pendingInvitations.find(c => 
          c.id === recipientId ||
          c.pending_recipient_email === recipientId
        );
      }

      if (!connection) {
        console.log('⚠️ [AddressVerificationWarning] Connection not found for recipientId:', recipientId);
        setVerificationStatus(null);
        return;
      }

      // For pending invitations, address is not verified yet
      if (connection.status === 'pending_invitation') {
        setVerificationStatus({
          verified: false,
          connectionName: connection.pending_recipient_name || 'this recipient',
          isPending: true
        });
        return;
      }

      // For accepted connections, check profile address verification
      if (connection.connected_user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('address_verified, name')
          .eq('id', connection.connected_user_id)
          .single();

        setVerificationStatus({
          verified: profile?.address_verified || false,
          connectionName: profile?.name || connection.profile_name || 'this recipient',
          isPending: false
        });
      }
    };

    if (recipientId) {
      checkVerification();
    }
  }, [recipientId, connections, pendingInvitations]);

  if (!verificationStatus) return null;

  if (verificationStatus.verified) {
    return (
      <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-700 dark:text-green-300">Address Verified ✓</AlertTitle>
        <AlertDescription className="text-green-600 dark:text-green-400">
          {verificationStatus.connectionName}'s address is verified and ready for auto-gifting.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-900/20">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-700 dark:text-amber-300">Address Not Verified</AlertTitle>
      <AlertDescription className="text-amber-600 dark:text-amber-400">
        {verificationStatus.isPending ? (
          <>
            {verificationStatus.connectionName} hasn't signed up yet. 
            Auto-gifts will be paused until they accept your invitation and verify their shipping address.
          </>
        ) : (
          <>
            {verificationStatus.connectionName}'s address has not been verified yet. 
            Auto-gifts will be paused until they verify their shipping address in settings. 
            You can ask them to complete verification.
          </>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default AddressVerificationWarning;
