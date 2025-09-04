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
import { Gift, Heart, Users, UserPlus, Calendar, Sparkles } from 'lucide-react';

interface InvitationData {
  invitation_id: string;
  recipient_email: string;
  recipient_name: string;
  inviter_context: string;
  source: string;
  relationship_type?: string;
  occasion?: string;
}

interface InviterDetails {
  name: string;
  first_name?: string;
  last_name?: string;
  profile_image?: string;
}

export const InvitationSignupFlow: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [inviterDetails, setInviterDetails] = useState<InviterDetails | null>(null);
  const [loadingInviter, setLoadingInviter] = useState(false);
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
    const inviter_context = searchParams.get('inviter_context') || searchParams.get('giftor'); // Support both parameter names
    const source = searchParams.get('source');
    const relationship_type = searchParams.get('relationship_type');
    const occasion = searchParams.get('occasion');

    if (invitation_id && recipient_email && recipient_name) {
      const invitationData = {
        invitation_id,
        recipient_email,
        recipient_name,
        inviter_context: inviter_context || 'connection_request',
        source: source || 'manual_invite',
        relationship_type: relationship_type || undefined,
        occasion: occasion || undefined
      };
      
      setInvitationData(invitationData);

      // Pre-populate email
      setFormData(prev => ({ ...prev, email: recipient_email }));
      
      // Fetch inviter details
      fetchInviterDetails(invitation_id);
    }
  }, [searchParams]);

  const fetchInviterDetails = async (invitationId: string) => {
    setLoadingInviter(true);
    try {
      // First get the invitation details to get the inviter's user_id
      const { data: invitationDetails, error: invitationError } = await supabase
        .from("gift_invitation_analytics")
        .select("user_id, relationship_type, occasion")
        .eq("id", invitationId)
        .single();

      if (invitationError || !invitationDetails) {
        console.error("Error fetching invitation details:", invitationError);
        return;
      }

      // Then get the inviter's profile information
      const { data: inviterProfile, error: profileError } = await supabase
        .from("profiles")
        .select("name, first_name, last_name, profile_image")
        .eq("id", invitationDetails.user_id)
        .single();

      if (profileError) {
        console.error("Error fetching inviter profile:", profileError);
        return;
      }

      setInviterDetails(inviterProfile);
      
      // Update invitation data with fetched details
      setInvitationData(prev => prev ? {
        ...prev,
        relationship_type: invitationDetails.relationship_type || prev.relationship_type,
        occasion: invitationDetails.occasion || prev.occasion
      } : prev);

    } catch (error) {
      console.error("Error in fetchInviterDetails:", error);
    } finally {
      setLoadingInviter(false);
    }
  };

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

      // Get the inviter's user ID from the invitation
      const { data: invitationDetails } = await supabase
        .from("gift_invitation_analytics")
        .select("user_id, relationship_type")
        .eq("id", invitationData.invitation_id)
        .single();

      if (invitationDetails) {
        // Create the user connection between inviter and invitee
        const { error: connectionError } = await supabase
          .from("user_connections")
          .insert({
            user_id: invitationDetails.user_id, // The inviter
            connected_user_id: user.id, // The new user who just signed up
            status: 'accepted', // Auto-accept invitation connections
            relationship_type: invitationDetails.relationship_type || 'friend',
            created_at: new Date().toISOString()
          });

        if (connectionError) {
          console.error("Error creating user connection:", connectionError);
          // Don't fail the flow for this, just log it
        } else {
          console.log("Successfully created user connection");
        }
      }

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

  // Helper functions for personalized messaging
  const getPersonalizedGreeting = () => {
    if (loadingInviter) return "You're Invited!";
    
    if (inviterDetails?.name || inviterDetails?.first_name) {
      const inviterName = inviterDetails.first_name || inviterDetails.name || "Someone";
      return `${inviterName} invited you!`;
    }
    
    return "You're Invited!";
  };

  const getPersonalizedSubtitle = () => {
    if (loadingInviter) return "Loading invitation details...";
    
    const inviterName = inviterDetails?.first_name || inviterDetails?.name || "Someone";
    const relationship = invitationData?.relationship_type;
    const occasion = invitationData?.occasion;
    
    let message = `${inviterName} wants to connect with you on Elyphant`;
    
    if (relationship && relationship !== 'friend') {
      if (relationship === 'family') {
        message += " as family";
      } else if (relationship === 'coworker') {
        message += " as a coworker";
      } else if (relationship === 'close_friend') {
        message += " as a close friend";
      } else {
        message += ` as ${relationship}`;
      }
    }
    
    if (occasion) {
      message += ` for ${occasion}`;
    }
    
    return message + " to make gift-giving magical together! 🎁";
  };

  const getContextualIcon = () => {
    const occasion = invitationData?.occasion;
    const relationship = invitationData?.relationship_type;
    
    if (occasion?.toLowerCase().includes('birthday')) return Calendar;
    if (occasion?.toLowerCase().includes('holiday') || occasion?.toLowerCase().includes('christmas')) return Sparkles;
    if (relationship === 'family') return Heart;
    if (relationship === 'coworker') return Users;
    return UserPlus;
  };

  const getContextualColors = () => {
    const occasion = invitationData?.occasion;
    const relationship = invitationData?.relationship_type;
    
    if (occasion?.toLowerCase().includes('birthday')) {
      return {
        bgColor: 'bg-yellow-50',
        iconColor: 'text-yellow-600',
        borderColor: 'border-yellow-200'
      };
    }
    
    if (occasion?.toLowerCase().includes('holiday') || occasion?.toLowerCase().includes('christmas')) {
      return {
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600', 
        borderColor: 'border-green-200'
      };
    }
    
    if (relationship === 'family') {
      return {
        bgColor: 'bg-rose-50',
        iconColor: 'text-rose-600',
        borderColor: 'border-rose-200'
      };
    }
    
    // Default purple theme
    return {
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary',
      borderColor: 'border-primary/20'
    };
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
          {/* Inviter Profile Section */}
          {inviterDetails?.profile_image && (
            <div className="mx-auto mb-3">
              <img 
                src={inviterDetails.profile_image} 
                alt={`${inviterDetails.first_name || inviterDetails.name}'s profile`}
                className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
              />
            </div>
          )}
          
          {/* Dynamic Icon based on context */}
          {(() => {
            const IconComponent = getContextualIcon();
            const colors = getContextualColors();
            return (
              <div className={`mx-auto mb-4 p-3 ${colors.bgColor} ${colors.borderColor} border rounded-full w-fit`}>
                <IconComponent className={`h-6 w-6 ${colors.iconColor}`} />
              </div>
            );
          })()}
          
          <CardTitle className="text-2xl font-bold mb-2">
            {getPersonalizedGreeting()}
          </CardTitle>
          
          <p className="text-muted-foreground leading-relaxed">
            {getPersonalizedSubtitle()}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Dynamic context section based on invitation details */}
          {(() => {
            const colors = getContextualColors();
            const relationship = invitationData?.relationship_type;
            const occasion = invitationData?.occasion;
            const inviterName = inviterDetails?.first_name || inviterDetails?.name || "Your friend";
            
            return (
              <div className={`${colors.bgColor} ${colors.borderColor} border p-4 rounded-lg space-y-3`}>
                <div className="flex items-center gap-2">
                  <Gift className={`h-4 w-4 ${colors.iconColor}`} />
                  <span className="font-medium">
                    {occasion ? `${occasion} Connection` : 
                     relationship === 'family' ? 'Family Connection' :
                     relationship === 'coworker' ? 'Work Connection' :
                     'Friend Connection'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong>What you'll get:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Access to {inviterName}'s wishlist</li>
                    <li>Smart gift recommendations</li>
                    <li>
                      {occasion ? `Help with ${occasion} planning` : 
                       relationship === 'family' ? 'Family gift coordination' :
                       'Never miss important dates'}
                    </li>
                    <li>Private gift planning together</li>
                  </ul>
                </div>
              </div>
            );
          })()}

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