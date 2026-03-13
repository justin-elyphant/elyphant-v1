import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gift, Users, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

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
        // Try by username first, then by ID
        let query = supabase
          .from("profiles")
          .select("id, name, username, profile_image, bio")
          .eq("username", username)
          .single();

        let { data, error } = await query;

        if (error || !data) {
          // Try by ID
          const { data: byId, error: idError } = await supabase
            .from("profiles")
            .select("id, name, username, profile_image, bio")
            .eq("id", username)
            .single();

          if (idError || !byId) {
            setLoading(false);
            return;
          }
          data = byId;
        }

        // Get wishlist count
        const { count } = await supabase
          .from("wishlists")
          .select("id", { count: "exact", head: true })
          .eq("user_id", data.id)
          .eq("is_public", true);

        setInviter({
          id: data.id,
          name: data.name || "Elyphant User",
          username: data.username || username,
          profile_image: data.profile_image,
          bio: data.bio,
          wishlistCount: count || 0,
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
      // Redirect to auth with invite context
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

      if (result.success) {
        toast.success(`Connection request sent to ${inviter.name}!`);
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

  return (
    <>
      <Helmet>
        <title>{inviter.name} invited you to Elyphant</title>
        <meta
          name="description"
          content={`Join ${inviter.name} on Elyphant — share wishlists and send perfect gifts to each other.`}
        />
      </Helmet>

      <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
                    Connect with {inviter.name.split(" ")[0]}
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Sign Up & Connect
                  </>
                )}
              </Button>

              {!user && (
                <p className="text-xs text-muted-foreground">
                  Create a free account to connect and start sharing wishlists
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default InvitePage;
