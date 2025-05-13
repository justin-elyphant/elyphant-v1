
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Globe, Users, Lock } from 'lucide-react';
import { SharingLevel } from '@/types/supabase';
import { cn } from '@/lib/utils';

interface PrivacyLevelBadgeProps {
  level: SharingLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const PrivacyLevelBadge: React.FC<PrivacyLevelBadgeProps> = ({
  level,
  size = 'md',
  showLabel = true,
  className
}) => {
  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  const badgeSize = {
    sm: 'px-1.5 py-0 text-[10px]',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-2.5 py-0.5 text-sm'
  };
  
  const getVariant = () => {
    switch (level) {
      case 'public':
        return 'bg-green-100 text-green-700 hover:bg-green-200';
      case 'friends':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
      case 'private':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  };
  
  const getLabelText = () => {
    switch (level) {
      case 'public':
        return 'Public';
      case 'friends':
        return 'Friends';
      case 'private':
        return 'Private';
    }
  };
  
  const getIcon = () => {
    switch (level) {
      case 'public':
        return <Globe className={iconSize[size]} />;
      case 'friends':
        return <Users className={iconSize[size]} />;
      case 'private':
        return <Lock className={iconSize[size]} />;
    }
  };
  
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-normal flex items-center gap-1',
        getVariant(),
        badgeSize[size],
        className
      )}
    >
      {getIcon()}
      {showLabel && <span>{getLabelText()}</span>}
    </Badge>
  );
};

export default PrivacyLevelBadge;
