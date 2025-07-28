import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, MessageCircle, Users, Gift, CheckCircle, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { type NicoleDiscoveryLog } from '@/hooks/useNicoleDiscovery';
import { formatDistanceToNow, format } from 'date-fns';

interface NicoleJourneyProps {
  discoveryLog: NicoleDiscoveryLog;
}

const NicoleJourney: React.FC<NicoleJourneyProps> = ({ discoveryLog }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'initiated':
        return <Clock className="h-4 w-4" />;
      case 'contacted':
        return <MessageCircle className="h-4 w-4" />;
      case 'data_collected':
        return <Users className="h-4 w-4" />;
      case 'rule_created':
        return <Gift className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStepColor = (status: string, currentStatus: string) => {
    const statusOrder = ['initiated', 'contacted', 'data_collected', 'rule_created', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(status);
    
    if (stepIndex <= currentIndex) {
      return 'bg-primary text-primary-foreground';
    }
    return 'bg-muted text-muted-foreground';
  };

  const getStepText = (status: string) => {
    switch (status) {
      case 'initiated':
        return 'Discovery Started';
      case 'contacted':
        return 'Contact Made';
      case 'data_collected':
        return 'Data Collected';
      case 'rule_created':
        return 'Auto-Gift Rule Created';
      case 'completed':
        return 'Process Complete';
      default:
        return status;
    }
  };

  const steps = ['initiated', 'contacted', 'data_collected', 'rule_created', 'completed'];

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Nicole's Journey
                <Badge variant="outline" className="ml-2">
                  {discoveryLog.recipient_email}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" className="p-0">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            {/* Timeline Steps */}
            <div className="space-y-4 mb-6">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${getStepColor(step, discoveryLog.discovery_status)}`}>
                    {getStepIcon(step)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{getStepText(step)}</p>
                    {step === discoveryLog.discovery_status && (
                      <p className="text-sm text-muted-foreground">Current step</p>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-px h-8 ml-6 ${
                      steps.indexOf(discoveryLog.discovery_status) > index 
                        ? 'bg-primary' 
                        : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Timeline Events */}
            {discoveryLog.timeline_events.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Detailed Timeline</h4>
                <div className="space-y-3">
                  {discoveryLog.timeline_events.map((event, index) => (
                    <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{event.event}</p>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(event.timestamp), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Insights */}
            {discoveryLog.data_collected && Object.keys(discoveryLog.data_collected.preferences).length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Nicole's Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Preferences */}
                  {discoveryLog.data_collected.interests.length > 0 && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="font-medium text-sm mb-2">Discovered Interests</p>
                      <div className="flex flex-wrap gap-1">
                        {discoveryLog.data_collected.interests.map((interest, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confidence Metrics */}
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm mb-2">Confidence Scores</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Overall</span>
                        <span>{Math.round(discoveryLog.confidence_metrics.overall_score * 100)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Preferences</span>
                        <span>{Math.round(discoveryLog.confidence_metrics.preference_confidence * 100)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Budget</span>
                        <span>{Math.round(discoveryLog.confidence_metrics.budget_confidence * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Summary */}
            {discoveryLog.conversation_summary && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-2">Conversation Summary</h4>
                <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                  {discoveryLog.conversation_summary}
                </p>
              </div>
            )}

            {/* Meta Information */}
            <div className="border-t pt-4 mt-4 flex justify-between text-xs text-muted-foreground">
              <span>Started {formatDistanceToNow(new Date(discoveryLog.created_at), { addSuffix: true })}</span>
              {discoveryLog.completed_at && (
                <span>Completed {formatDistanceToNow(new Date(discoveryLog.completed_at), { addSuffix: true })}</span>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default NicoleJourney;