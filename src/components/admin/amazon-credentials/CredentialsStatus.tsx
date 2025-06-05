
import React from 'react';
import { CheckCircle, AlertCircle } from "lucide-react";

interface ElyphantCredentials {
  email: string;
  is_verified: boolean;
  last_verified_at?: string;
  created_at?: string;
  credential_name?: string;
  notes?: string;
}

interface CredentialsStatusProps {
  credentials: ElyphantCredentials;
}

const CredentialsStatus = ({ credentials }: CredentialsStatusProps) => {
  return (
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
  );
};

export default CredentialsStatus;
