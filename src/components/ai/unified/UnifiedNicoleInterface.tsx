
import React from 'react';
import { NicoleUnifiedInterface } from './NicoleUnifiedInterface';

interface UnifiedNicoleInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: any;
  className?: string;
}

/**
 * Wrapper component that maintains backward compatibility
 * while using the new NicoleUnifiedInterface as the core implementation
 */
const UnifiedNicoleInterface: React.FC<UnifiedNicoleInterfaceProps> = (props) => {
  return <NicoleUnifiedInterface {...props} />;
};

export default UnifiedNicoleInterface;
