import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AddNewAddressForm from '@/components/checkout/AddNewAddressForm';

interface AddressRequest {
  id: string;
  requester_id: string;
  recipient_email: string;
  message: string;
  status: 'pending' | 'completed' | 'declined' | 'expired';
  expires_at: string;
  requester_name?: string;
}

const AddressProviderPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<AddressRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (requestId) {
      loadRequest();
    }
  }, [requestId]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the address request
      const { data: requestData, error: requestError } = await supabase
        .from('address_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      if (!requestData) {
        setError('Address request not found');
        return;
      }

      if (requestError) throw requestError;

      if (!requestData) {
        setError('Address request not found');
        return;
      }

      // Check if expired
      const expiresAt = new Date(requestData.expires_at);
      if (expiresAt < new Date()) {
        setIsExpired(true);
        setError('This address request has expired');
      }

      // Check if already completed
      if (requestData.status === 'completed') {
        setError('This address request has already been completed');
      }

      if (requestData.status === 'declined') {
        setError('This address request has been declined');
      }

      // Get requester name from profiles table
      let requesterName = 'Someone';
      if (requestData.requester_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name, first_name, last_name, email')
          .eq('id', requestData.requester_id)
          .single();

        if (profileData) {
          requesterName = profileData.name || 
                         `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() ||
                         profileData.email ||
                         'Someone';
        }
      }

      setRequest({
        id: requestData.id,
        requester_id: requestData.requester_id,
        recipient_email: requestData.recipient_email,
        message: requestData.message || '',
        status: requestData.status as 'pending' | 'completed' | 'declined' | 'expired',
        expires_at: requestData.expires_at,
        requester_name: requesterName
      });
    } catch (err: any) {
      console.error('Error loading address request:', err);
      setError(err.message || 'Failed to load address request');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (address: any) => {
    if (!request) return;

    try {
      setSubmitting(true);

      // Update the address request with the provided address
      const { error: updateError } = await supabase
        .from('address_requests')
        .update({
          status: 'completed',
          shipping_address: {
            name: address.full_name || address.name,
            address_line1: address.address_line1,
            address_line2: address.address_line2,
            city: address.city,
            state: address.state,
            zip_code: address.zip_code,
            country: address.country,
            phone: address.phone
          },
          completed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Send confirmation email to requester
      await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'address_request_completed',
          customData: {
            requester_id: request.requester_id,
            recipient_email: request.recipient_email,
            recipient_name: address.full_name || address.name
          }
        }
      });

      toast.success('Address submitted successfully!');
      
      // Show success state for 2 seconds before redirecting
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting address:', err);
      toast.error('Failed to submit address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!request) return;

    try {
      setSubmitting(true);

      const { error: updateError } = await supabase
        .from('address_requests')
        .update({
          status: 'declined',
          completed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      toast.success('Request declined');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      console.error('Error declining request:', err);
      toast.error('Failed to decline request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Request Not Available</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => navigate('/')} 
              className="mt-4 w-full"
            >
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!request) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Address Request</CardTitle>
                <CardDescription>
                  {request.requester_name} would like your shipping address
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {request.message && (
              <Alert>
                <AlertDescription className="text-sm">
                  "{request.message}"
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Address Form Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle>Your Shipping Address</CardTitle>
            </div>
            <CardDescription>
              This information will be shared with {request.requester_name} to send you a gift
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddNewAddressForm
              onAddressAdded={handleAddressSubmit}
              onCancel={handleDecline}
              defaultName=""
            />
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleDecline}
                disabled={submitting}
                className="w-full"
              >
                Decline Request
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Your address will only be shared with {request.requester_name} for the purpose of sending you a gift. 
            It will not be stored or used for any other purpose.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default AddressProviderPage;
