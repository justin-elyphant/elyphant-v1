import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Gift, Heart, Users } from 'lucide-react';

interface InvitationData {
  invitation_id: string;
  recipient_email: string;
  recipient_name: string;
  inviter_context: string;
  source: string;
}

export const InvitationSignupFlow: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    bio: ''
  });

  useEffect(() => {
    // Extract invitation data from URL params
    const invitation_id = searchParams.get('invitation_id');
    const recipient_email = searchParams.get('recipient_email');
    const recipient_name = searchParams.get('recipient_name');
    const inviter_context = searchParams.get('inviter_context');
    const source = searchParams.get('source');

    if (invitation_id && recipient_email && recipient_name) {
      setInvitationData({
        invitation_id,
        recipient_email,
        recipient_name,
        inviter_context: inviter_context || 'connection_request',
        source: source || 'manual_invite'
      });

      // Pre-populate email
      setFormData(prev => ({ ...prev, email: recipient_email }));
    }
  }, [searchParams]);

  useEffect(() => {
    // Redirect if already authenticated
    if (user && invitationData) {
      handlePostSignupFlow();
    }
  }, [user, invitationData]);

  const handlePostSignupFlow = async () => {
    if (!user || !invitationData) return;

    try {
      // Track signup completion
      await supabase.from("invitation_conversion_events").insert({
        invitation_id: invitationData.invitation_id,
        event_type: "signup_completed",
        event_data: { 
          signup_method: "invitation_flow",
          source: invitationData.source 
        }
      });

      // Navigate to profile setup with invitation context
      navigate(`/profile-setup?invitation_id=${invitationData.invitation_id}&source=invitation`);
    } catch (error) {
      console.error("Error in post-signup flow:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitationData) {
      toast.error("Invalid invitation data");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      // Track signup start
      await supabase.from("invitation_conversion_events").insert({
        invitation_id: invitationData.invitation_id,
        event_type: "signup_started",
        event_data: { source: invitationData.source }
      });

      // Use Supabase directly since signUp function signature varies
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            bio: formData.bio,
            invitation_context: invitationData
          }
        }
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Account created! Setting up your profile...");
      
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!invitationData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Invalid invitation link. Please check your email for the correct link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <p className="text-muted-foreground">
            Someone wants to connect with you on Elyphant for gift sharing
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-secondary/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium">Connection Request</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Join Elyphant to share wishlists and make gift-giving easier for everyone
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is the email the invitation was sent to
              </p>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="bio">About You (Optional)</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us a bit about yourself..."
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Join Elyphant"}
            </Button>
          </form>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Heart className="h-4 w-4" />
              <span>Making gift-giving magical</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};