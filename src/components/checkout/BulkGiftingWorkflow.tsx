import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Gift, Calendar, MessageSquare, Copy, Wand2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { toast } from 'sonner';

interface BulkGiftingWorkflowProps {
  connections: any[];
  onComplete: (assignments: any[]) => void;
}

const BulkGiftingWorkflow: React.FC<BulkGiftingWorkflowProps> = ({
  connections,
  onComplete
}) => {
  const { cartItems } = useCart();
  const { profile } = useProfile();
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [assignmentMode, setAssignmentMode] = useState<'same' | 'different'>('same');
  const [commonMessage, setCommonMessage] = useState('');
  const [customMessages, setCustomMessages] = useState<{[key: string]: string}>({});
  const [scheduledDate, setScheduledDate] = useState('');
  const [useTemplate, setUseTemplate] = useState(false);

  const handleConnectionToggle = (connectionId: string) => {
    setSelectedConnections(prev => 
      prev.includes(connectionId) 
        ? prev.filter(id => id !== connectionId)
        : [...prev, connectionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedConnections.length === connections.length) {
      setSelectedConnections([]);
    } else {
      setSelectedConnections(connections.map(c => c.id));
    }
  };

  const handleApplyTemplate = () => {
    const template = `Hi! I hope you're doing well. I saw this and thought of you - hope you like it! 

With love,
${profile?.name || 'Your friend'}`;
    
    if (assignmentMode === 'same') {
      setCommonMessage(template);
    } else {
      const templateMessages = selectedConnections.reduce((acc, connId) => {
        const connection = connections.find(c => c.id === connId);
        acc[connId] = template.replace('this', `these items`);
        return acc;
      }, {} as {[key: string]: string});
      setCustomMessages(templateMessages);
    }
    
    toast.success('Template applied to messages');
  };

  const handleCopyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    toast.success('Message copied to clipboard');
  };

  const handleComplete = () => {
    const assignments = selectedConnections.map(connectionId => {
      const connection = connections.find(c => c.id === connectionId);
      return {
        connectionId,
        connectionName: connection?.name,
        items: assignmentMode === 'same' ? cartItems.map(item => item.product.product_id) : [],
        message: assignmentMode === 'same' ? commonMessage : customMessages[connectionId] || '',
        scheduledDate: scheduledDate || null
      };
    });
    
    onComplete(assignments);
  };

  const totalValue = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const perPersonValue = selectedConnections.length > 0 ? totalValue / selectedConnections.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Gift Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {selectedConnections.length}
              </div>
              <div className="text-sm text-muted-foreground">Recipients</div>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                ${perPersonValue.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Per Person</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipient Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Recipients
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedConnections.length === connections.length ? 'Deselect All' : 'Select All'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {connections.map(connection => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedConnections.includes(connection.id)}
                    onCheckedChange={() => handleConnectionToggle(connection.id)}
                  />
                  <div>
                    <div className="font-medium">{connection.name}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {connection.relationship_type}
                    </div>
                  </div>
                </div>
                {connection.has_address ? (
                  <Badge variant="default" className="text-xs">
                    Address Available
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    No Address
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedConnections.length > 0 && (
        <>
          {/* Assignment Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Item Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={assignmentMode === 'same'}
                    onCheckedChange={() => setAssignmentMode('same')}
                  />
                  <div>
                    <div className="font-medium">Send same items to everyone</div>
                    <div className="text-sm text-muted-foreground">
                      All {selectedConnections.length} recipients get the same items
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={assignmentMode === 'different'}
                    onCheckedChange={() => setAssignmentMode('different')}
                  />
                  <div>
                    <div className="font-medium">Customize items per recipient</div>
                    <div className="text-sm text-muted-foreground">
                      Choose different items for each person
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gift Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Gift Messages
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyTemplate}
                  className="flex items-center gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Use Template
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignmentMode === 'same' ? (
                <div className="space-y-2">
                  <Label>Common message for all recipients</Label>
                  <div className="relative">
                    <Textarea
                      value={commonMessage}
                      onChange={(e) => setCommonMessage(e.target.value)}
                      placeholder="Enter your gift message here..."
                      className="min-h-[100px]"
                    />
                    {commonMessage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => handleCopyMessage(commonMessage)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Label>Custom messages per recipient</Label>
                  {selectedConnections.map(connectionId => {
                    const connection = connections.find(c => c.id === connectionId);
                    return (
                      <div key={connectionId} className="space-y-2">
                        <Label className="text-sm">
                          Message for {connection?.name}
                        </Label>
                        <div className="relative">
                          <Textarea
                            value={customMessages[connectionId] || ''}
                            onChange={(e) => setCustomMessages(prev => ({
                              ...prev,
                              [connectionId]: e.target.value
                            }))}
                            placeholder={`Personal message for ${connection?.name}...`}
                            className="min-h-[80px]"
                          />
                          {customMessages[connectionId] && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => handleCopyMessage(customMessages[connectionId])}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Delivery Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={!scheduledDate}
                    onCheckedChange={() => setScheduledDate('')}
                  />
                  <div>
                    <div className="font-medium">Send immediately</div>
                    <div className="text-sm text-muted-foreground">
                      Process and ship as soon as possible
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={Boolean(scheduledDate)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        setScheduledDate(tomorrow.toISOString().split('T')[0]);
                      } else {
                        setScheduledDate('');
                      }
                    }}
                  />
                  <div>
                    <div className="font-medium">Schedule for specific date</div>
                    <div className="text-sm text-muted-foreground">
                      Coordinate delivery timing
                    </div>
                  </div>
                </div>
                
                {scheduledDate && (
                  <div className="ml-6 space-y-2">
                    <Label>Delivery Date</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-48"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleComplete}
              className="flex-1"
              disabled={selectedConnections.length === 0}
            >
              Set Up {selectedConnections.length} Gift{selectedConnections.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default BulkGiftingWorkflow;