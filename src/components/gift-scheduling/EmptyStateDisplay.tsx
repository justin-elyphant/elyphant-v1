
import React from 'react';
import { Gift, Clock } from 'lucide-react';

interface EmptyStateDisplayProps {
  type: 'upcoming' | 'history';
}

const EmptyStateDisplay: React.FC<EmptyStateDisplayProps> = ({ type }) => {
  const icon = type === 'upcoming' ? (
    <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
  ) : (
    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
  );
  
  const message = type === 'upcoming' ? 'No scheduled gifts' : 'No gift history';
  
  return (
    <div className="text-center py-8">
      {icon}
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
};

export default EmptyStateDisplay;
