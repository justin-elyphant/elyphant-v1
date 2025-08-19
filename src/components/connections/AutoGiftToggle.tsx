import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface AutoGiftToggleProps {
  connectionName: string;
  connectionId: string;
  isEnabled: boolean;
  isLoading?: boolean;
  onToggle: (connectionId: string, enabled: boolean) => void;
  className?: string;
}

export const AutoGiftToggle: React.FC<AutoGiftToggleProps> = ({
  connectionName,
  connectionId,
  isEnabled,
  isLoading = false,
  onToggle,
  className
}) => {
  const handleToggle = (checked: boolean) => {
    console.log('🎛️ AutoGiftToggle handleToggle called:', { checked, isLoading, connectionId });
    if (!isLoading) {
      console.log('🚀 Calling onToggle with:', { connectionId, checked });
      onToggle(connectionId, checked);
    } else {
      console.log('⏳ Toggle is loading, ignoring click');
    }
  };

  return (
    <div className={`flex items-center justify-between py-2 ${className}`}>
      <Label htmlFor={`auto-gift-${connectionId}`} className="text-sm font-medium text-muted-foreground">
        Auto-Gifting with {connectionName}
      </Label>
      <div className="flex items-center gap-2">
        {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        <Switch
          id={`auto-gift-${connectionId}`}
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={isLoading}
          className="data-[state=checked]:bg-primary h-4 w-7"
        />
      </div>
    </div>
  );
};