import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gift, Users, Heart, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import ElyphantTextLogo from "@/components/ui/ElyphantTextLogo";

interface InviterProfile {
  id: string;
  name: string;
  username: string;
  profile_image: string | null;
  bio: string | null;
  wishlistCount: number;
}

const InvitePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inviter, setInviter] = useState<InviterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const fetchInviter = async () => {
      if (!username) {
        setLoading(false);
        return;
      }

      try {
        // Use SECURITY DEFINER RPC so anonymous visitors can resolve the
        // inviter even if the inviter has no public wishlists yet.
        const { data, error } = await supabase
          .rpc("get_invite_profile", { _identifier: username })
          .maybeSingle();

        if (error || !data) {
          if (error) console.error("get_invite_profile error:", error);
          setLoading(false);
          return;
        }

        setInviter({
          id: data.id,
          name: data.name || "Elyphant User",
          username: data.username || username,
          profile_image: data.profile_image,
          bio: data.bio,
          wishlistCount: Number(data.wishlist_count) || 0,
        });
      } catch (err) {
        console.error("Error fetching inviter profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInviter();
  }, [username]);

  const handleConnect = async () => {
    if (!user && inviter) {
      // Store invite context in localStorage so it survives email confirmation redirects
      localStorage.setItem('elyphant_invite_user', inviter.id);
      localStorage.setItem('elyphant_invite_username', inviter.username);
      navigate(`/auth?invite_user=${inviter.id}`);
      return;
    }

    if (!user || !inviter) return;

    setConnecting(true);
    try {
      const { sendConnectionRequest } = await import(
        "@/services/connections/connectionService"
      );
      const result = await sendConnectionRequest(inviter.id, "friend");

      if (result.success && result.data?.id) {
        // Auto-accept: invite link is the intent signal, skip pending state
        const { acceptConnectionRequest } = await import(
          "@/services/connections/connectionService"
        );
        await acceptConnectionRequest(result.data.id);
        toast.success(`Connected with ${inviter.name}!`);
        navigate("/connections");
      } else if (result.success) {
        toast.success(`Connected with ${inviter.name}!`);
        navigate("/connections");
      } else {
        toast.error(result.error?.message || "Failed to connect");
      }
    } catch (err) {
      console.error("Error connecting:", err);
      toast.error("Something went wrong");
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!inviter) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <h1 className="text-2xl font-bold mb-2">User not found</h1>
        <p className="text-muted-foreground mb-6">
          This invite link doesn't seem to be valid.
        </p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  const initials = inviter.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const firstName = inviter.name.split(" ")[0];

  return (
    <>
      <Helmet>
        <title>{inviter.name} invited you to Elyphant</title>
        <meta
          name="description"
          content={`Join ${inviter.name} on Elyphant — share wishlists and send perfect gifts to each other.`}
        />
      </Helmet>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="max-w-sm mx-auto px-4 py-2 flex items-center">
          <div onClick={() => navigate("/")} className="cursor-pointer">
            <ElyphantTextLogo />
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 pt-20">
        {/* Personalized heading */}
        <h2 className="text-lg font-semibold text-foreground mb-4 text-center">
          {inviter.name} invited you to Elyphant
        </h2>

        <Card className="w-full max-w-sm shadow-lg border">
          <CardContent className="pt-8 pb-6 text-center space-y-6">
            {/* Avatar */}
            <Avatar className="h-24 w-24 mx-auto ring-4 ring-primary/10">
              <AvatarImage src={inviter.profile_image || undefined} alt={inviter.name} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Name & bio */}
            <div>
              <h1 className="text-xl font-bold">{inviter.name}</h1>
              <p className="text-muted-foreground text-sm">@{inviter.username}</p>
              {inviter.bio && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {inviter.bio}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-6 text-sm">
              {inviter.wishlistCount > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Gift className="h-4 w-4" />
                  <span>
                    {inviter.wishlistCount} wishlist{inviter.wishlistCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Heart className="h-4 w-4" />
                <span>Gifting network</span>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full"
                size="lg"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : user ? (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Connect with {firstName}
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Sign Up & Connect
                  </>
                )}
              </Button>

              {/* Benefits list for unauthenticated users */}
              {!user && (
                <div className="pt-2 space-y-2.5 text-left">
                  <div className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      You'll be automatically connected with {firstName}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Create your first wishlist so {firstName} knows what to get you
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Discover perfect gifts for friends and family
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default InvitePage;
