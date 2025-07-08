
import React from "react";
// Re-export the enhanced version for backward compatibility
import EnhancedConnectionRequests from "./EnhancedConnectionRequests";

// This component now uses the enhanced version with address collection
export type { ConnectionRequest } from "./EnhancedConnectionRequests";

interface ConnectionRequestsProps {
  requests: any[];
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

const ConnectionRequests: React.FC<ConnectionRequestsProps> = (props) => {
  // Use the enhanced version with address collection
  return <EnhancedConnectionRequests {...props} />;
};

export default ConnectionRequests;
