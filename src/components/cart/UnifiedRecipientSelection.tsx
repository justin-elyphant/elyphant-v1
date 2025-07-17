import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Mail, 
  MapPin, 
  Plus, 
  Search, 
  Clock, 
  UserPlus, 
  ArrowRight,
  User,
  Heart
} from 'lucide-react';
import { UnifiedRecipient, unifiedRecipientService } from '@/services/unifiedRecipientService';
import { toast } from 'sonner';

interface UnifiedRecipientSelectionProps {
  onRecipientSelect: (recipient: UnifiedRecipient) => void;
  onClose: () => void;
  title?: string;
  selectedRecipientId?: string;
}

interface NewRecipientForm {
  name: string;
  email: string;
  relationship_type: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  notes?: string;
}

const UnifiedRecipientSelection: React.FC<UnifiedRecipientSelectionProps> = ({
  onRecipientSelect,
  onClose,
  title = "Select Recipient",
  selectedRecipientId
}) => {
  const [recipients, setRecipients] = useState<UnifiedRecipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewRecipientForm, setShowNewRecipientForm] = useState(false);
  const [newRecipientType, setNewRecipientType] = useState<'address_book' | 'pending'>('address_book');
  const [newRecipientForm, setNewRecipientForm] = useState<NewRecipientForm>({
    name: '',
    email: '',
    relationship_type: 'friend',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    notes: ''
  });

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    setIsLoading(true);
    try {
      const allRecipients = await unifiedRecipientService.getAllRecipients();
      setRecipients(allRecipients);
    } catch (error) {
      console.error('Error fetching recipients:', error);
      toast.error('Failed to load recipients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewRecipientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRecipientForm.name.trim()) {
      toast.error('Please enter a recipient name');
      return;
    }

    try {
      if (newRecipientType === 'address_book') {
        const newRecipient = await unifiedRecipientService.createAddressBookRecipient({
          name: newRecipientForm.name,
          email: newRecipientForm.email,
          relationship_type: newRecipientForm.relationship_type,
          address: newRecipientForm.address,
          notes: newRecipientForm.notes
        });
        
        const unifiedRecipient: UnifiedRecipient = {
          id: newRecipient.id,
          name: newRecipient.name,
          email: newRecipient.email,
          address: newRecipient.address,
          source: 'address_book',
          relationship_type: newRecipient.relationship_type,
          created_at: newRecipient.created_at
        };
        
        onRecipientSelect(unifiedRecipient);
        toast.success('Recipient added to address book');
      } else {
        if (!newRecipientForm.email.trim()) {
          toast.error('Email is required for pending invitations');
          return;
        }
        
        const newPendingRecipient = await unifiedRecipientService.createPendingRecipient({
          name: newRecipientForm.name,
          email: newRecipientForm.email,
          relationship_type: newRecipientForm.relationship_type,
          address: newRecipientForm.address
        });
        
        const unifiedRecipient: UnifiedRecipient = {
          id: newPendingRecipient.id,
          name: newRecipientForm.name,
          email: newRecipientForm.email,
          address: newRecipientForm.address,
          source: 'pending',
          relationship_type: newRecipientForm.relationship_type,
          status: 'pending_invitation'
        };
        
        onRecipientSelect(unifiedRecipient);
        toast.success('Invitation sent to recipient');
      }
      
      setShowNewRecipientForm(false);
      resetNewRecipientForm();
    } catch (error) {
      console.error('Error creating recipient:', error);
      toast.error('Failed to create recipient');
    }
  };

  const resetNewRecipientForm = () => {
    setNewRecipientForm({
      name: '',
      email: '',
      relationship_type: 'friend',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US'
      },
      notes: ''
    });
  };

  const filteredRecipients = recipients.filter(recipient =>
    recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipient.relationship_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedRecipients = filteredRecipients.reduce((acc, recipient) => {
    if (!acc[recipient.source]) {
      acc[recipient.source] = [];
    }
    acc[recipient.source].push(recipient);
    return acc;
  }, {} as Record<string, UnifiedRecipient[]>);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'connection':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'address_book':
        return <User className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'connection':
        return 'Connected Friends';
      case 'pending':
        return 'Pending Invitations';
      case 'address_book':
        return 'Address Book';
      default:
        return source;
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading recipients...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] mx-4 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {title}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden">
          {!showNewRecipientForm ? (
            <div className="space-y-4 h-full flex flex-col">
              {/* Search */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search recipients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Recipients List */}
              <ScrollArea className="flex-1">
                <div className="space-y-4">
                  {Object.entries(groupedRecipients).map(([source, sourceRecipients]) => (
                    <div key={source}>
                      <div className="flex items-center gap-2 mb-2">
                        {getSourceIcon(source)}
                        <h3 className="font-medium text-sm">{getSourceLabel(source)}</h3>
                        <Badge variant="secondary">{sourceRecipients.length}</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {sourceRecipients.map((recipient) => (
                          <div
                            key={recipient.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                              selectedRecipientId === recipient.id ? 'border-primary bg-primary/5' : ''
                            }`}
                            onClick={() => onRecipientSelect(recipient)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {getSourceIcon(recipient.source)}
                                  <div>
                                    <p className="font-medium">{recipient.name}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Heart className="h-3 w-3" />
                                      <span className="capitalize">{recipient.relationship_type}</span>
                                      {recipient.email && (
                                        <>
                                          <span>•</span>
                                          <Mail className="h-3 w-3" />
                                          <span>{recipient.email}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {recipient.source === 'pending' && (
                                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                                    Pending
                                  </Badge>
                                )}
                                {recipient.address && (
                                  <MapPin className="h-4 w-4 text-green-600" />
                                )}
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {Object.keys(groupedRecipients).indexOf(source) < Object.keys(groupedRecipients).length - 1 && (
                        <Separator className="my-4" />
                      )}
                    </div>
                  ))}
                  
                  {filteredRecipients.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No recipients found' : 'No recipients yet'}
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Add New Recipient Button */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowNewRecipientForm(true)}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Recipient
                </Button>
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* New Recipient Form */
            <form onSubmit={handleNewRecipientSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="h-5 w-5" />
                <h3 className="font-medium">Add New Recipient</h3>
              </div>

              {/* Recipient Type Selection */}
              <div className="space-y-2">
                <Label>Recipient Type</Label>
                <Select value={newRecipientType} onValueChange={(value: 'address_book' | 'pending') => setNewRecipientType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="address_book">Address Book Entry</SelectItem>
                    <SelectItem value="pending">Send Invitation</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {newRecipientType === 'address_book' 
                    ? 'Save recipient details for future use'
                    : 'Send an invitation to connect and share address'
                  }
                </p>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newRecipientForm.name}
                    onChange={(e) => setNewRecipientForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter recipient's name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship</Label>
                  <Select value={newRecipientForm.relationship_type} onValueChange={(value) => setNewRecipientForm(prev => ({ ...prev, relationship_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="colleague">Colleague</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Email (required for pending invitations) */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email {newRecipientType === 'pending' && '*'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newRecipientForm.email}
                  onChange={(e) => setNewRecipientForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  required={newRecipientType === 'pending'}
                />
              </div>

              {/* Address (optional) */}
              <div className="space-y-3">
                <Label>Shipping Address (Optional)</Label>
                <div className="grid grid-cols-1 gap-3">
                  <Input
                    placeholder="Street address"
                    value={newRecipientForm.address?.street || ''}
                    onChange={(e) => setNewRecipientForm(prev => ({ 
                      ...prev, 
                      address: { ...prev.address!, street: e.target.value } 
                    }))}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="City"
                      value={newRecipientForm.address?.city || ''}
                      onChange={(e) => setNewRecipientForm(prev => ({ 
                        ...prev, 
                        address: { ...prev.address!, city: e.target.value } 
                      }))}
                    />
                    <Input
                      placeholder="State"
                      value={newRecipientForm.address?.state || ''}
                      onChange={(e) => setNewRecipientForm(prev => ({ 
                        ...prev, 
                        address: { ...prev.address!, state: e.target.value } 
                      }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="ZIP Code"
                      value={newRecipientForm.address?.zipCode || ''}
                      onChange={(e) => setNewRecipientForm(prev => ({ 
                        ...prev, 
                        address: { ...prev.address!, zipCode: e.target.value } 
                      }))}
                    />
                    <Input
                      placeholder="Country"
                      value={newRecipientForm.address?.country || 'US'}
                      onChange={(e) => setNewRecipientForm(prev => ({ 
                        ...prev, 
                        address: { ...prev.address!, country: e.target.value } 
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Notes (address book only) */}
              {newRecipientType === 'address_book' && (
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={newRecipientForm.notes}
                    onChange={(e) => setNewRecipientForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any notes about this recipient..."
                    rows={3}
                  />
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button type="submit" className="flex-1">
                  {newRecipientType === 'address_book' ? 'Add to Address Book' : 'Send Invitation'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowNewRecipientForm(false);
                    resetNewRecipientForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedRecipientSelection;