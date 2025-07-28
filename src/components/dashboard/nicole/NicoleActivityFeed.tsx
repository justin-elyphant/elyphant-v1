import React from 'react';
import { Brain, Clock, CheckCircle, Users, Gift, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNicoleDiscovery, type NicoleDiscoveryLog } from '@/hooks/useNicoleDiscovery';
import { formatDistanceToNow } from 'date-fns';

interface NicoleActivityFeedProps {
  showAll?: boolean;
  maxItems?: number;
}

const NicoleActivityFeed: React.FC<NicoleActivityFeedProps> = ({ 
  showAll = false, 
  maxItems = 5 
}) => {
  const { discoveryLogs, loading } = useNicoleDiscovery();

  const getStatusIcon = (status: NicoleDiscoveryLog['discovery_status']) => {
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

  const getStatusColor = (status: NicoleDiscoveryLog['discovery_status']) => {
    switch (status) {
      case 'initiated':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'contacted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'data_collected':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'rule_created':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusText = (status: NicoleDiscoveryLog['discovery_status']) => {
    switch (status) {
      case 'initiated':
        return 'Discovery Started';
      case 'contacted':
        return 'Contact Made';
      case 'data_collected':
        return 'Data Collected';
      case 'rule_created':
        return 'Rule Created';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const displayLogs = showAll ? discoveryLogs : discoveryLogs.slice(0, maxItems);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Nicole's Recent Discoveries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (discoveryLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Nicole's Recent Discoveries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nicole hasn't made any proactive discoveries yet
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              She'll start reaching out to your connections to gather gift preferences
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Nicole's Recent Discoveries
          <Badge variant="secondary" className="ml-auto">
            {discoveryLogs.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <div className={`p-2 rounded-full ${getStatusColor(log.discovery_status)}`}>
                {getStatusIcon(log.discovery_status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">
                    {log.recipient_email || 'Unknown recipient'}
                  </p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStatusColor(log.discovery_status)}`}
                  >
                    {getStatusText(log.discovery_status)}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {log.conversation_summary || 'Gathering gift preferences and insights'}
                </p>
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </p>
                  
                  {log.confidence_metrics.overall_score > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Confidence:</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(log.confidence_metrics.overall_score * 100)}%
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {!showAll && discoveryLogs.length > maxItems && (
            <Button variant="ghost" className="w-full">
              View All Discoveries ({discoveryLogs.length})
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NicoleActivityFeed;