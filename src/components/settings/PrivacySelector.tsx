
import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SharingLevel } from '@/types/supabase';
import { Globe, Users, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import PrivacyLevelBadge from './PrivacyLevelBadge';

interface PrivacySelectorProps {
  value: SharingLevel;
  onChange: (value: SharingLevel) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  className?: string;
}

/**
 * A component for selecting privacy/sharing levels with visual cues
 */
const PrivacySelector: React.FC<PrivacySelectorProps> = ({
  value,
  onChange,
  disabled = false,
  label,
  description,
  className
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {(label || description) && (
        <div className="space-y-1">
          {label && <Label className="text-base">{label}</Label>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      
      <RadioGroup
        value={value}
        onValueChange={onChange as (val: string) => void}
        disabled={disabled}
        className="space-y-2"
      >
        <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50 cursor-pointer">
          <RadioGroupItem value="public" id="privacy-public" />
          <Label htmlFor="privacy-public" className="flex flex-1 items-center gap-2 cursor-pointer">
            <Globe className="h-4 w-4 text-green-600" />
            <div className="space-y-0.5">
              <div>Everyone</div>
              <div className="text-xs text-muted-foreground">Visible to anyone who views your profile</div>
            </div>
          </Label>
          <PrivacyLevelBadge level="public" size="sm" showLabel={false} />
        </div>
        
        <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50 cursor-pointer">
          <RadioGroupItem value="friends" id="privacy-friends" />
          <Label htmlFor="privacy-friends" className="flex flex-1 items-center gap-2 cursor-pointer">
            <Users className="h-4 w-4 text-blue-600" />
            <div className="space-y-0.5">
              <div>Connected Friends</div>
              <div className="text-xs text-muted-foreground">Only visible to users you're connected with</div>
            </div>
          </Label>
          <PrivacyLevelBadge level="friends" size="sm" showLabel={false} />
        </div>
        
        <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50 cursor-pointer">
          <RadioGroupItem value="private" id="privacy-private" />
          <Label htmlFor="privacy-private" className="flex flex-1 items-center gap-2 cursor-pointer">
            <Lock className="h-4 w-4 text-gray-600" />
            <div className="space-y-0.5">
              <div>Only You</div>
              <div className="text-xs text-muted-foreground">Only visible to you, completely private</div>
            </div>
          </Label>
          <PrivacyLevelBadge level="private" size="sm" showLabel={false} />
        </div>
      </RadioGroup>
    </div>
  );
};

export default PrivacySelector;
