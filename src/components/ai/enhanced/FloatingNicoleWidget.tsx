
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useNicoleState } from '@/contexts/nicole/NicoleStateContext';
import { NicoleUnifiedInterface } from '@/components/ai/unified/NicoleUnifiedInterface';

interface FloatingNicoleWidgetProps {
  onNavigateToResults?: (query: string) => void;
  position?: 'bottom-right' | 'bottom-left';
  initialMinimized?: boolean;
}

const FloatingNicoleWidget: React.FC<FloatingNicoleWidgetProps> = ({
  onNavigateToResults,
  position = 'bottom-right',
  initialMinimized = true
}) => {
  const { state, actions } = useNicoleState();
  
  const handleOpen = () => {
    if (actions.canActivateMode('floating')) {
      actions.activateMode('floating');
    }
  };

  // Show floating button when Nicole is closed or in search mode
  if (state.activeMode === 'closed' || state.activeMode === 'search') {
    return (
      <Button
        onClick={handleOpen}
        disabled={!actions.canActivateMode('floating')}
        className={`fixed z-40 ${
          position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'
        } rounded-full h-14 w-14 shadow-lg bg-primary hover:bg-primary/90 transition-all duration-200`}
        size="lg"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  // Show unified interface when in floating mode
  if (state.activeMode === 'floating') {
    return (
      <NicoleUnifiedInterface 
        onNavigateToResults={onNavigateToResults}
      />
    );
  }

  return null;
};

export default FloatingNicoleWidget;
