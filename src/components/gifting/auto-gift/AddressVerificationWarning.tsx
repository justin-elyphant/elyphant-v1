import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { EnhancedConnection } from '@/hooks/profile/useEnhancedConnections';
import { supabase } from '@/integrations/supabase/client';

interface AddressVerificationWarningProps {
  recipientId: string;
  connections: EnhancedConnection[];
  pendingInvitations: EnhancedConnection[];
  sentRequests: EnhancedConnection[];
}

const AddressVerificationWarning: React.FC<AddressVerificationWarningProps> = ({
  recipientId,
  connections,
  pendingInvitations,
  sentRequests
}) => {
  const [verificationStatus, setVerificationStatus] = useState<{
    verified: boolean;
    connectionName: string;
    isPending: boolean;
  } | null>(null);

  useEffect(() => {
    const checkVerification = async () => {
      // Try to find connection - recipientId could be connection.id, connected_user_id, display_user_id, or pending email
      let connection = connections.find(c => 
        c.id === recipientId || 
        c.connected_user_id === recipientId ||
        c.display_user_id === recipientId
      );

      // Check pending invitations if not found in accepted connections
      if (!connection) {
        connection = pendingInvitations.find(c => 
          c.id === recipientId ||
          c.pending_recipient_email === recipientId ||
          c.display_user_id === recipientId
        );
      }

      // Check outgoing sent requests (status: pending, user is sender)
      if (!connection) {
        connection = sentRequests.find(c => 
          c.id === recipientId ||
          c.connected_user_id === recipientId ||
          c.display_user_id === recipientId
        );
      }

      if (!connection) {
        console.log('⚠️ [AddressVerificationWarning] Connection not found for recipientId:', recipientId);
        setVerificationStatus(null);
        return;
      }

      // CRITICAL: Determine the correct target user ID (the RECIPIENT, not the sender)
      // display_user_id is specifically designed to show the "other" person in the connection
      // For connections where current user is sender, display_user_id = connected_user_id
      // For connections where current user is receiver, display_user_id = user_id (the sender)
      const targetUserId = connection.display_user_id || connection.connected_user_id;
      
      // Use the profile name from the connection's display fields, which are already set correctly
      const connectionName = connection.profile_name || connection.pending_recipient_name || 'this recipient';

      console.log('🔍 [AddressVerificationWarning] Checking recipient:', {
        recipientId,
        targetUserId,
        connectionName,
        connectionId: connection.id,
        displayUserId: connection.display_user_id,
        connectedUserId: connection.connected_user_id
      });

      // For pending invitations, address is not verified yet
      if (connection.status === 'pending_invitation') {
        setVerificationStatus({
          verified: false,
          connectionName,
          isPending: true
        });
        return;
      }

      // For outgoing pending requests (status: pending, user is sender)
      // Check the recipient's address verification status
      if (connection.status === 'pending') {
        if (targetUserId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('address_verified, name')
            .eq('id', targetUserId)
            .single();

          // Use profile_name from connection first (already correctly mapped), fallback to fetched name
          setVerificationStatus({
            verified: profile?.address_verified || false,
            connectionName: connectionName,
            isPending: true // Connection is pending
          });
        } else {
          setVerificationStatus({
            verified: false,
            connectionName,
            isPending: true
          });
        }
        return;
      }

      // For accepted connections, check profile address verification
      if (targetUserId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('address_verified, name')
          .eq('id', targetUserId)
          .single();

        // Use profile_name from connection (already correctly mapped for display)
        setVerificationStatus({
          verified: profile?.address_verified || false,
          connectionName: connectionName,
          isPending: false
        });
      } else {
        // No target user ID available
        setVerificationStatus({
          verified: false,
          connectionName,
          isPending: false
        });
      }
    };

    if (recipientId) {
      checkVerification();
    }
  }, [recipientId, connections, pendingInvitations, sentRequests]);

  if (!verificationStatus) return null;

  if (verificationStatus.verified) {
    return (
      <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-700 dark:text-green-300">Address Verified ✓</AlertTitle>
        <AlertDescription className="text-green-600 dark:text-green-400">
          {verificationStatus.connectionName}'s address is verified and ready for auto-gifting.
          {verificationStatus.isPending && (
            <span className="block text-xs mt-1 opacity-75">(Connection pending)</span>
          )}
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
