
import React from 'react';
import { Shield, Users, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PrivacyLevel } from '@/utils/privacyUtils';

interface PrivacyNoticeProps {
  level: PrivacyLevel;
  className?: string;
}

const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ level, className = '' }) => {
  const getPrivacyDetails = (level: PrivacyLevel) => {
    switch (level) {
      case 'private':
        return {
          label: 'Only Me',
          icon: <Shield className="h-3 w-3 mr-1" />,
          color: 'bg-red-100 text-red-800 hover:bg-red-200'
        };
      case 'friends':
        return {
          label: 'Friends Only',
          icon: <Users className="h-3 w-3 mr-1" />,
          color: 'bg-amber-100 text-amber-800 hover:bg-amber-200'
        };
      case 'public':
        return {
          label: 'Public',
          icon: <Globe className="h-3 w-3 mr-1" />,
          color: 'bg-green-100 text-green-800 hover:bg-green-200'
        };
      default:
        return {
          label: 'Private',
          icon: <Shield className="h-3 w-3 mr-1" />,
          color: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        };
    }
  };

  const details = getPrivacyDetails(level);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={`${details.color} flex items-center text-xs px-2 py-0.5 ${className}`}>
          {details.icon}
          {details.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">
          {level === 'private' && 'Only you can see this information'}
          {level === 'friends' && 'Only your connections can see this information'}
          {level === 'public' && 'Anyone can see this information'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

export default PrivacyNotice;
