import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import RelationshipSelector from "@/components/shared/RelationshipSelector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Users, Mail, ArrowRight, CheckCircle, Clock } from "lucide-react";
import { useEnhancedConnections } from "@/hooks/profile/useEnhancedConnections";
import { useAuth } from "@/contexts/auth";
import { unifiedGiftManagementService } from "@/services/UnifiedGiftManagementService";
import { toast } from "sonner";

interface UnifiedRecipientSelectorProps {
  value: string;
  onChange: (value: string, data?: any) => void;
  selectedRecipient?: any;
}

const UnifiedRecipientSelector = ({ value, onChange, selectedRecipient }: UnifiedRecipientSelectorProps) => {
  const { user } = useAuth();
  const { connections, loading } = useEnhancedConnections();
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPersonForm, setNewPersonForm] = useState({
    name: "",
    email: "",
    relationshipType: "friend"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConnectionSelect = (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (connection) {
      onChange(connectionId, {
        recipientId: connection.connected_user_id,
        recipientEmail: connection.profile_email,
        relationshipType: connection.relationship_type,
        connectionStatus: connection.status,
        isExistingConnection: true
      });
    }
  };

  const handleAddNewPerson = async () => {
    if (!user || !newPersonForm.name || !newPersonForm.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create pending connection with invitation using unified service
      const result = await unifiedGiftManagementService.createPendingConnection(
        newPersonForm.email,
        newPersonForm.name,
        newPersonForm.relationshipType
      );
      
      if (result) {
        // Set this as the selected recipient
        onChange(result.id, {
          recipientEmail: newPersonForm.email,
          recipientName: newPersonForm.name,
          relationshipType: newPersonForm.relationshipType,
          connectionStatus: 'pending_invitation',
          isExistingConnection: false,
          pendingInvitation: true
        });

        toast.success(`Invitation sent to ${newPersonForm.name}! Auto-gift will activate when they join.`);
        setShowAddPerson(false);
        setNewPersonForm({ name: "", email: "", relationshipType: "friend" });
      } else {
        toast.error("Failed to send invitation. Please try again.");
      }
    } catch (error) {
      console.error("Error adding new person:", error);
      toast.error("Failed to send invitation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>Choose Recipient</Label>
        <div className="h-12 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Label className="text-base font-medium">Step 1: Who would you like to gift?</Label>
        
        {/* Existing Connections */}
        {connections.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Your Connections</span>
            </div>
            
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {connections.map((connection) => (
                <Card 
                  key={connection.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    value === connection.id 
                      ? "border-primary bg-primary/5" 
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => handleConnectionSelect(connection.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={connection.profile_image} />
                        <AvatarFallback>
                          {connection.profile_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {connection.profile_name || 'Unknown User'}
                          </p>
                          {connection.status === 'accepted' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {connection.status === 'pending_invitation' && (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {connection.relationship_type}
                          </Badge>
                          {connection.status === 'pending_invitation' && (
                            <Badge variant="outline" className="text-xs">
                              Invitation Sent
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {value === connection.id && (
                        <div className="text-primary">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Add New Person Button */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserPlus className="h-4 w-4" />
            <span>Add Someone New</span>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowAddPerson(true)}
            className="w-full justify-start gap-2 h-auto p-4"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium">Add New Person</p>
              <p className="text-sm text-muted-foreground">
                We'll invite them to join for better gift recommendations
              </p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>
        </div>

        {/* Selected Recipient Info */}
        {selectedRecipient && (
          <div className="p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span>Recipient Selected</span>
            </div>
            <p className="font-medium">
              {selectedRecipient.recipientName || selectedRecipient.profile_name}
            </p>
            <p className="text-sm text-muted-foreground">
              {selectedRecipient.relationshipType} • {selectedRecipient.connectionStatus}
            </p>
            {selectedRecipient.pendingInvitation && (
              <p className="text-xs text-yellow-600 mt-1">
                🎁 Auto-gifting will activate when they complete their profile
              </p>
            )}
          </div>
        )}
      </div>

      {/* Add New Person Modal */}
      <Dialog open={showAddPerson} onOpenChange={setShowAddPerson}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Person</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={newPersonForm.name}
                onChange={(e) => setNewPersonForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter their full name"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={newPersonForm.email}
                onChange={(e) => setNewPersonForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter their email address"
              />
            </div>
            
            <div>
              <Label htmlFor="relationship">Relationship</Label>
              <RelationshipSelector
                value={newPersonForm.relationshipType}
                onValueChange={(value) => setNewPersonForm(prev => ({ ...prev, relationshipType: value }))}
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">We'll send them an invitation</p>
                  <p className="text-blue-700">
                    They'll get an email to create a profile with their preferences, 
                    which helps us pick better gifts for them.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddPerson(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleAddNewPerson} 
                disabled={isSubmitting || !newPersonForm.name || !newPersonForm.email}
                className="flex-1"
              >
                {isSubmitting ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UnifiedRecipientSelector;
