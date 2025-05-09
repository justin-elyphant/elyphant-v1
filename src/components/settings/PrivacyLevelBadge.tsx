
import React from 'react';
import { SharingLevel } from '@/types/supabase';
import { Shield, Globe, Users, Lock } from 'lucide-react';
import { getSharingLevelLabel } from '@/utils/privacyUtils';
import { cn } from '@/lib/utils';

interface PrivacyLevelBadgeProps {
  level: SharingLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * A component that displays a badge representing a privacy/sharing level
 */
const PrivacyLevelBadge: React.FC<PrivacyLevelBadgeProps> = ({ 
  level, 
  showLabel = true,
  size = 'md',
  className 
}) => {
  // Determine icon and colors based on privacy level
  const getIcon = () => {
    switch (level) {
      case 'public':
        return <Globe className={iconClasses} />;
      case 'friends':
        return <Users className={iconClasses} />;
      case 'private':
        return <Lock className={iconClasses} />;
      default:
        return <Shield className={iconClasses} />;
    }
  };
  
  // Calculate sizes
  const iconClasses = cn({
    'h-3 w-3': size === 'sm',
    'h-4 w-4': size === 'md',
    'h-5 w-5': size === 'lg',
  });
  
  const textClasses = cn({
    'text-xs': size === 'sm',
    'text-sm': size === 'md',
    'text-base': size === 'lg',
  });
  
  // Calculate colors based on level
  const badgeClasses = cn(
    'flex items-center gap-1.5 rounded-full px-2 py-0.5',
    {
      'bg-green-100 text-green-700 border border-green-200': level === 'public',
      'bg-blue-100 text-blue-700 border border-blue-200': level === 'friends',
      'bg-gray-100 text-gray-700 border border-gray-200': level === 'private',
    },
    className
  );

  return (
    <span className={badgeClasses}>
      {getIcon()}
      {showLabel && <span className={textClasses}>{getSharingLevelLabel(level)}</span>}
    </span>
  );
};

export default PrivacyLevelBadge;
