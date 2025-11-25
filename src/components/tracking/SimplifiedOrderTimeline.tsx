import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface TrackingStep {
  status: string;
  location: string;
  timestamp: string;
  completed: boolean;
  current: boolean;
}

interface SimplifiedOrderTimelineProps {
  steps: TrackingStep[];
}

const SimplifiedOrderTimeline = ({ steps }: SimplifiedOrderTimelineProps) => {
  // Calculate progress percentage
  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;
  
  return (
    <div className="space-y-8">
      {/* Horizontal Progress Bar */}
      <div className="space-y-3">
        <div className="relative">
          {/* Background bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            {/* Progress fill with Elyphant gradient */}
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-sky-500 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Step markers */}
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center" style={{ width: `${100 / steps.length}%` }}>
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-foreground mb-2" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground mb-2" />
                )}
                <div className="text-center">
                  <div className={`text-sm font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.status}
                  </div>
                  {step.completed && step.timestamp && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(step.timestamp).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Detailed step information - only show completed and current steps */}
      <div className="space-y-4 pt-6 border-t">
        {steps
          .filter(step => step.completed || step.current)
          .map((step, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">{step.status}</h4>
                {step.current && (
                  <span className="text-xs text-muted-foreground">In Progress</span>
                )}
              </div>
              {step.location && (
                <p className="text-sm text-muted-foreground">{step.location}</p>
              )}
              {step.timestamp && (
                <p className="text-xs text-muted-foreground">
                  {new Date(step.timestamp).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default SimplifiedOrderTimeline;
