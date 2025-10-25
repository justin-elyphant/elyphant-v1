import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { unifiedRecipientService, UnifiedRecipient } from '@/services/unifiedRecipientService';
import { toast } from 'sonner';
import RelationshipSelector from '@/components/shared/RelationshipSelector';

interface NewRecipientFormData {
  name: string;
  email: string;
  relationship_type: string;
  notes?: string;
}

interface NewRecipientFormProps {
  onRecipientCreate: (recipient: UnifiedRecipient) => void;
  onCancel: () => void;
  title?: string;
}

const NewRecipientForm: React.FC<NewRecipientFormProps> = ({
  onRecipientCreate,
  onCancel,
  title = "Add New Recipient"
}) => {
  const [formData, setFormData] = useState<NewRecipientFormData>({
    name: '',
    email: '',
    relationship_type: 'friend',
    notes: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState('');
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Relationship types now handled by RelationshipSelector component

  // Check if email exists in the platform
  const checkEmailExists = async (email: string) => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailExists(null);
      return;
    }

    setCheckingEmail(true);
    try {
      const result = await unifiedRecipientService.checkEmailExists(email.trim().toLowerCase());
      setEmailExists(result.exists);
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailExists(null);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsCreating(true);
    setCreationProgress('Validating form data...');
    
    // Enhanced validation
    if (!formData.name.trim()) {
      toast.error('Please enter a recipient name');
      setIsCreating(false);
      setCreationProgress('');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      toast.error('Please enter a valid email address');
      setIsCreating(false);
      setCreationProgress('');
      return;
    }

    try {
      setCreationProgress('Sending invitation...');
      
      const sanitizedData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        relationship_type: formData.relationship_type
      };
      
      const newPendingRecipient = await unifiedRecipientService.createPendingRecipient(sanitizedData);
      
      const unifiedRecipient: UnifiedRecipient = {
        id: newPendingRecipient.id,
        name: sanitizedData.name,
        email: sanitizedData.email,
        source: 'pending',
        relationship_type: sanitizedData.relationship_type,
        status: 'pending_invitation'
      };
      
      setCreationProgress('Finalizing...');
      onRecipientCreate(unifiedRecipient);
      toast.success(`Invitation sent! ${sanitizedData.name} will provide their address during signup.`);
      
    } catch (error: any) {
      console.error('Failed to create recipient:', error);
      
      let userFriendlyMessage = 'Failed to send invitation. Please try again.';
      
      if (error?.message?.includes('duplicate') || error?.code === '23505') {
        userFriendlyMessage = 'A recipient with this email already exists.';
      } else if (error?.message?.includes('Authentication') || error?.message?.includes('session')) {
        userFriendlyMessage = 'Please sign in again to continue.';
      }
      
      toast.error(userFriendlyMessage);
    } finally {
      setIsCreating(false);
      setCreationProgress('');
    }
  };


  return (
    <Card className="w-full max-w-2xl mx-auto max-h-[90vh] flex flex-col">
      <CardHeader className="sticky top-0 z-10 bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur border-b shrink-0 pt-5 pb-3">
        <CardTitle className="grid grid-cols-[auto_1fr_auto] items-center gap-2 leading-tight text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="-ml-2 justify-self-start"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="justify-self-center">{title}</span>
          <span className="justify-self-end w-5 h-5">
            <UserPlus className="h-5 w-5 mx-auto" />
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 pb-32 pt-16 md:pt-20 overflow-y-auto ios-smooth-scroll">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter recipient's name"
                disabled={isCreating}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, email: e.target.value }));
                  checkEmailExists(e.target.value);
                }}
                placeholder="recipient@example.com"
                disabled={isCreating}
                required
              />
              {checkingEmail && (
                <p className="text-xs text-muted-foreground mt-1">Checking email...</p>
              )}
              {emailExists === true && (
                <p className="text-xs text-amber-600 mt-1">⚠️ This user is already on Elyphant - we'll send a connection request instead</p>
              )}
              {emailExists === false && (
                <p className="text-xs text-green-600 mt-1">✓ Available - invitation will be sent</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="relationship">Relationship *</Label>
            <RelationshipSelector
              value={formData.relationship_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, relationship_type: value }))}
              disabled={isCreating}
            />
          </div>


          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any special notes about this recipient..."
              disabled={isCreating}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isCreating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{creationProgress || 'Creating...'}</span>
                </div>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewRecipientForm;