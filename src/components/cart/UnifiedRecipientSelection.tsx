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
import GooglePlacesAutocomplete from '@/components/forms/GooglePlacesAutocomplete';
import { StandardizedAddress } from '@/services/googlePlacesService';
import { toast } from 'sonner';
import { searchFriends, FriendSearchResult } from '@/services/search/friendSearchService';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import AddressRequestDialog from './AddressRequestDialog';

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
    address_line2?: string;
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
  const [newRecipientForm, setNewRecipientForm] = useState<NewRecipientForm>({
    name: '',
    email: '',
    relationship_type: 'friend',
    address: {
      street: '',
      address_line2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    notes: ''
  });
  const [addressValue, setAddressValue] = useState('');
  const [isCreatingRecipient, setIsCreatingRecipient] = useState(false);
  const [creationProgress, setCreationProgress] = useState('');
  const { user } = useAuth();
  const [userSearchResults, setUserSearchResults] = useState<FriendSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addressRequestRecipient, setAddressRequestRecipient] = useState<UnifiedRecipient | null>(null);

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
    
    console.log('🚀 [RECIPIENT_CREATION] Starting recipient creation process');
    setIsCreatingRecipient(true);
    setCreationProgress('Validating form data...');
    
    console.log('📝 [RECIPIENT_CREATION] Form data:', {
      name: newRecipientForm.name,
      email: newRecipientForm.email,
      relationship_type: newRecipientForm.relationship_type,
      address: newRecipientForm.address
    });

    // Enhanced validation with detailed logging
    if (!newRecipientForm.name.trim()) {
      console.error('❌ [VALIDATION] Name validation failed - empty name');
      toast.error('Please enter a recipient name');
      setIsCreatingRecipient(false);
      setCreationProgress('');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newRecipientForm.email.trim()) {
      console.error('❌ [VALIDATION] Email validation failed - empty email');
      toast.error('Email is required');
      setIsCreatingRecipient(false);
      setCreationProgress('');
      return;
    }
    
    if (!emailRegex.test(newRecipientForm.email.trim())) {
      console.error('❌ [VALIDATION] Email validation failed - invalid format:', newRecipientForm.email);
      toast.error('Please enter a valid email address');
      setIsCreatingRecipient(false);
      setCreationProgress('');
      return;
    }

    // Enhanced address validation
    const address = newRecipientForm.address;
    console.log('🏠 [VALIDATION] Address validation:', address);
    
    if (!address?.street?.trim()) {
      console.error('❌ [VALIDATION] Address validation failed - missing street');
      toast.error('Street address is required');
      setIsCreatingRecipient(false);
      setCreationProgress('');
      return;
    }
    
    if (!address?.city?.trim()) {
      console.error('❌ [VALIDATION] Address validation failed - missing city');
      toast.error('City is required');
      setIsCreatingRecipient(false);
      setCreationProgress('');
      return;
    }
    
    if (!address?.state?.trim()) {
      console.error('❌ [VALIDATION] Address validation failed - missing state');
      toast.error('State is required');
      setIsCreatingRecipient(false);
      setCreationProgress('');
      return;
    }
    
    if (!address?.zipCode?.trim()) {
      console.error('❌ [VALIDATION] Address validation failed - missing ZIP code');
      toast.error('ZIP code is required');
      setIsCreatingRecipient(false);
      setCreationProgress('');
      return;
    }
    
    if (!address?.country?.trim()) {
      console.error('❌ [VALIDATION] Address validation failed - missing country');
      toast.error('Country is required');
      setIsCreatingRecipient(false);
      setCreationProgress('');
      return;
    }

    // Relationship type validation
    const validRelationshipTypes = ['friend', 'family', 'colleague', 'partner', 'other'];
    if (!validRelationshipTypes.includes(newRecipientForm.relationship_type)) {
      console.error('❌ [VALIDATION] Invalid relationship type:', newRecipientForm.relationship_type);
      toast.error('Please select a valid relationship type');
      setIsCreatingRecipient(false);
      setCreationProgress('');
      return;
    }

    console.log('✅ [VALIDATION] All validations passed');
    setCreationProgress('Checking authentication...');

    try {
      console.log('📡 [API_CALL] Creating pending recipient...');
      
      const sanitizedData = {
        name: newRecipientForm.name.trim(),
        email: newRecipientForm.email.trim().toLowerCase(),
        relationship_type: newRecipientForm.relationship_type,
        address: {
          street: address.street.trim(),
          address_line2: address.address_line2?.trim() || '',
          city: address.city.trim(),
          state: address.state.trim(),
          zipCode: address.zipCode.trim(),
          country: address.country.trim()
        }
      };
      
      console.log('🧹 [DATA_SANITIZATION] Sanitized data:', sanitizedData);
      setCreationProgress('Creating recipient invitation...');
      
      const newPendingRecipient = await unifiedRecipientService.createPendingRecipient(sanitizedData);
      
      console.log('✅ [API_SUCCESS] Pending recipient created:', newPendingRecipient);
      
      const unifiedRecipient: UnifiedRecipient = {
        id: newPendingRecipient.id,
        name: sanitizedData.name,
        email: sanitizedData.email,
        address: sanitizedData.address,
        source: 'pending',
        relationship_type: sanitizedData.relationship_type,
        status: 'pending_invitation'
      };
      
      console.log('🎯 [RECIPIENT_CREATION] Unified recipient object:', unifiedRecipient);
      
      setCreationProgress('Finalizing...');
      onRecipientSelect(unifiedRecipient);
      toast.success('Invitation sent to recipient');
      
      setShowNewRecipientForm(false);
      resetNewRecipientForm();
      
      console.log('🎉 [RECIPIENT_CREATION] Process completed successfully');
      
    } catch (error: any) {
      console.error('💥 [ERROR] Failed to create recipient:', {
        error,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint,
        timestamp: new Date().toISOString(),
        formData: {
          name: newRecipientForm.name,
          email: newRecipientForm.email,
          relationship_type: newRecipientForm.relationship_type
        }
      });
      
      // Enhanced error messages based on error type
      let userFriendlyMessage = 'Failed to create recipient. Please try again.';
      
      if (error?.message?.includes('Authentication') || error?.message?.includes('session') || error?.message?.includes('sign in')) {
        userFriendlyMessage = 'Please sign in again to continue.';
        console.error('🔐 [AUTH_ERROR] Authentication/session error');
      } else if (error?.message?.includes('not authenticated')) {
        userFriendlyMessage = 'Please sign in again to continue.';
        console.error('🔐 [AUTH_ERROR] User not authenticated');
      } else if (error?.message?.includes('JWT') || error?.message?.includes('token')) {
        userFriendlyMessage = 'Session expired. Please sign in again.';
        console.error('🔐 [TOKEN_ERROR] JWT/token error');
      } else if (error?.message?.includes('duplicate') || error?.code === '23505') {
        userFriendlyMessage = 'A recipient with this email already exists.';
        console.error('🔄 [DUPLICATE_ERROR] Duplicate recipient email');
      } else if (error?.message?.includes('network') || error?.code === 'PGRST301') {
        userFriendlyMessage = 'Network error. Please check your connection and try again.';
        console.error('🌐 [NETWORK_ERROR] Network connectivity issue');
      } else if (error?.message?.includes('permission') || error?.code === '42501') {
        userFriendlyMessage = 'Permission denied. Please contact support.';
        console.error('🚫 [PERMISSION_ERROR] Database permission denied');
      }
      
      toast.error(userFriendlyMessage);
    } finally {
      setIsCreatingRecipient(false);
      setCreationProgress('');
    }
  };

  const resetNewRecipientForm = () => {
    setNewRecipientForm({
      name: '',
      email: '',
      relationship_type: 'friend',
      address: {
        street: '',
        address_line2: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US'
      },
      notes: ''
    });
    setAddressValue('');
  };

  const handleAddressSelect = (standardizedAddress: StandardizedAddress) => {
    setNewRecipientForm(prev => ({
      ...prev,
      address: {
        ...prev.address!,
        street: standardizedAddress.street,
        city: standardizedAddress.city,
        state: standardizedAddress.state,
        zipCode: standardizedAddress.zipCode,
        country: standardizedAddress.country
      }
    }));
  };

  const handleNonConnectedUserSelect = async (searchResult: FriendSearchResult) => {
    try {
      console.log('📧 Selecting non-connected user:', searchResult.name);
      
      toast.loading('Preparing recipient...');
      
      // Check if user has a valid shipping address using database function
      const { data: hasAddress, error: checkError } = await supabase
        .rpc('has_valid_shipping_address', { target_user_id: searchResult.id });
      
      if (checkError) {
        console.error('Error checking address:', checkError);
        throw checkError;
      }

      if (!hasAddress) {
        toast.dismiss();
        toast.error('This user hasn\'t added a shipping address yet. Please add them manually.');
        setShowNewRecipientForm(true);
        setNewRecipientForm(prev => ({
          ...prev,
          name: searchResult.name,
          email: searchResult.email
        }));
        return;
      }

      // Get masked location for privacy (avoid fetching full address due to RLS)
      const { data: maskedLocation } = await supabase
        .rpc('get_masked_location', { target_user_id: searchResult.id });
      
      // Create pending invitation connection without fetching private address
      const { data: connectionData, error: connError } = await supabase
        .from('user_connections')
        .insert({
          user_id: user?.id,
          connected_user_id: searchResult.id,
          status: 'pending_invitation',
          relationship_type: 'friend',
          pending_recipient_email: searchResult.email,
          pending_recipient_name: searchResult.name,
          pending_shipping_address: maskedLocation || null
        })
        .select()
        .single();
      
      if (connError) throw connError;
      
      // Send connection invitation email via orchestrator
      const { error: emailError } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'connection_invitation',
          customData: {
            sender_name: user?.user_metadata?.name || user?.email || 'Someone',
            sender_email: user?.email,
            recipient_name: searchResult.name,
            recipient_email: searchResult.email,
            message: 'I\'d like to send you a gift and connect on Elyphant!',
            connection_id: connectionData.id
          }
        }
      });
      
      if (emailError) {
        console.warn('Email failed to send:', emailError);
        toast.dismiss();
        toast.warning('Gift prepared, but invitation email failed to send');
      } else {
        console.log('✅ Connection invitation email sent');
      }
      
      // Create unified recipient object
      const unifiedRecipient: UnifiedRecipient = {
        id: connectionData.id,
        name: searchResult.name,
        email: searchResult.email,
        address: maskedLocation || null,
        source: 'pending',
        relationship_type: 'friend',
        status: 'pending_invitation'
      };
      
      toast.dismiss();
      toast.success(`Gift prepared for ${searchResult.name}. They'll receive an invitation to connect.`);
      onRecipientSelect(unifiedRecipient);
      
    } catch (error: any) {
      console.error('Error selecting non-connected user:', error);
      toast.dismiss();
      toast.error('Failed to prepare recipient. Please try again.');
    }
  };

  // Universal user search effect
  useEffect(() => {
    const performUniversalSearch = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setUserSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // Search all users (not just existing recipients)
        const results = await searchFriends(searchTerm, user?.id);
        
        // Filter out users who are already recipients
        const recipientIds = new Set(recipients.map(r => r.id));
        const newUsers = results.filter(r => !recipientIds.has(r.id) && r.connectionStatus !== 'connected');
        
        setUserSearchResults(newUsers);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(performUniversalSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, user?.id, recipients]);

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
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
        
        <div className="flex-1 overflow-y-auto">
          <CardContent className="p-6">
            {!showNewRecipientForm ? (
              <div className="space-y-4">
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

                {/* User Search Results - Show non-connected users */}
                {userSearchResults.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <UserPlus className="h-4 w-4 text-blue-600" />
                      <h3 className="font-medium text-sm">Users on Elyphant</h3>
                      <Badge variant="secondary">{userSearchResults.length}</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {userSearchResults.map((searchResult) => (
                        <div
                          key={searchResult.id}
                          className="p-3 border rounded-lg cursor-pointer transition-colors hover:bg-accent"
                          onClick={() => handleNonConnectedUserSelect(searchResult)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <UserPlus className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="font-medium">{searchResult.name}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  <span>{searchResult.email}</span>
                                  {searchResult.connectionStatus === 'pending' && (
                                    <>
                                      <span>•</span>
                                      <Badge variant="outline" className="text-xs">Pending</Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-blue-600 border-blue-200">
                                Send Gift & Connect
                              </Badge>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="my-4" />
                  </div>
                )}

                {/* Recipients List */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
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
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  <h3 className="font-medium">Add New Recipient</h3>
                  {isCreatingRecipient && (
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">{creationProgress}</span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleNewRecipientSubmit} className="space-y-6">
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

                  {/* Email (required) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newRecipientForm.email}
                      onChange={(e) => setNewRecipientForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                      required
                    />
                  </div>

                  {/* Address with Google Places Autocomplete */}
                  <div className="space-y-4">
                    <Label>Shipping Address *</Label>
                    <div className="space-y-3">
                      <GooglePlacesAutocomplete
                        value={addressValue}
                        onChange={setAddressValue}
                        onAddressSelect={handleAddressSelect}
                        placeholder="Start typing street address..."
                        label=""
                      />
                      
                      <Input
                        placeholder="Apartment, suite, etc. (optional)"
                        value={newRecipientForm.address?.address_line2 || ''}
                        onChange={(e) => setNewRecipientForm(prev => ({ 
                          ...prev, 
                          address: { ...prev.address!, address_line2: e.target.value } 
                        }))}
                      />
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="City *"
                          value={newRecipientForm.address?.city || ''}
                          onChange={(e) => setNewRecipientForm(prev => ({ 
                            ...prev, 
                            address: { ...prev.address!, city: e.target.value } 
                          }))}
                          required
                        />
                        <Input
                          placeholder="State *"
                          value={newRecipientForm.address?.state || ''}
                          onChange={(e) => setNewRecipientForm(prev => ({ 
                            ...prev, 
                            address: { ...prev.address!, state: e.target.value } 
                          }))}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="ZIP Code *"
                          value={newRecipientForm.address?.zipCode || ''}
                          onChange={(e) => setNewRecipientForm(prev => ({ 
                            ...prev, 
                            address: { ...prev.address!, zipCode: e.target.value } 
                          }))}
                          required
                        />
                        <Input
                          placeholder="Country *"
                          value={newRecipientForm.address?.country || 'US'}
                          onChange={(e) => setNewRecipientForm(prev => ({ 
                            ...prev, 
                            address: { ...prev.address!, country: e.target.value } 
                          }))}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </form>

                {/* Form Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    onClick={handleNewRecipientSubmit}
                    disabled={isCreatingRecipient}
                  >
                    {isCreatingRecipient ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating...
                      </div>
                    ) : (
                      'Send Invitation'
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowNewRecipientForm(false);
                      resetNewRecipientForm();
                    }}
                    disabled={isCreatingRecipient}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      {/* Address Request Dialog */}
      {addressRequestRecipient && (
        <AddressRequestDialog
          open={!!addressRequestRecipient}
          onOpenChange={(open) => !open && setAddressRequestRecipient(null)}
          recipient={{
            id: addressRequestRecipient.id,
            name: addressRequestRecipient.name,
            email: addressRequestRecipient.email
          }}
        />
      )}
    </div>
  );
};

export default UnifiedRecipientSelection;