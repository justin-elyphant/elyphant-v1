
import React, { useState, useEffect } from "react";
import { Search, UserPlus, Loader2, X, Share2, MapPin, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { searchFriends, FriendSearchResult } from "@/services/search/privacyAwareFriendSearch";
import { sendConnectionRequest } from "@/services/connections/connectionService";
import { supabase } from "@/integrations/supabase/client";

interface SuggestedPerson {
  id: string;
  name: string;
  username: string;
  profile_image: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  mutual_count: number;
}

interface EnhancedConnectionSearchProps {
  onInvite?: (prefill: string) => void;
}

const EnhancedConnectionSearch: React.FC<EnhancedConnectionSearchProps> = ({ onInvite }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<FriendSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedPerson[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  // Load suggested connections on mount
  useEffect(() => {
    if (!user?.id) return;
    const loadSuggestions = async () => {
      setSuggestionsLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_suggested_connections', {
          requesting_user_id: user.id,
          suggestion_limit: 6
        });
        if (!error && data) {
          setSuggestions(data as SuggestedPerson[]);
        }
      } catch (e) {
        console.warn('Could not load suggestions:', e);
      } finally {
        setSuggestionsLoading(false);
      }
    };
    loadSuggestions();
  }, [user?.id]);

  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const friendResults = await searchFriends(query, user?.id);
      setResults(friendResults);
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Error searching for users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchUsers(searchTerm);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleSendConnectionRequest = async (targetUserId: string, targetName: string) => {
    if (!user) return;
    try {
      const result = await sendConnectionRequest(targetUserId, 'friend');
      if (result.success) {
        toast.success(`Connection request sent to ${targetName}`);
        setResults(prev => prev.map(r =>
          r.id === targetUserId ? { ...r, connectionStatus: 'pending' } : r
        ));
      } else {
        toast.error("Failed to send connection request");
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error("Failed to send connection request");
    }
  };

  const handleShare = async (username: string, name: string) => {
    const url = `${window.location.origin}/invite/${username}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Connect with ${name} on Elyphant`, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied");
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setResults([]);
  };

  const formatLocation = (city?: string, state?: string) => {
    if (city && state) return `${city}, ${state}`;
    return city || state || null;
  };

  const showSuggestions = searchTerm.length < 2 && suggestions.length > 0;
  const showEmptyState = searchTerm.length >= 2 && !loading && results.length === 0;

  return (
    <div className="space-y-5">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by name, username, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 h-12 rounded-xl text-base"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground touch-manipulation"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {loading && (
          <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 animate-spin" />
        )}
      </div>

      {/* Suggested connections — shown when not searching */}
      {showSuggestions && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            Suggested for you
          </p>
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2">
              {suggestions.map((person) => (
                <div
                  key={person.id}
                  className="flex-shrink-0 w-[140px] rounded-xl border border-border bg-card p-4 flex flex-col items-center text-center space-y-2"
                >
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={person.profile_image || undefined} />
                    <AvatarFallback className="text-sm">
                      {person.name?.substring(0, 2).toUpperCase() || 'UN'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="w-full min-w-0">
                    <p className="text-sm font-medium truncate">{person.name}</p>
                    {person.mutual_count > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {person.mutual_count} mutual
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full rounded-full text-xs h-8"
                    onClick={() => handleSendConnectionRequest(person.id, person.name || 'User')}
                  >
                    Connect
                  </Button>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* Suggestions loading skeleton */}
      {searchTerm.length < 2 && suggestionsLoading && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-[160px] w-[140px] rounded-xl flex-shrink-0" />
            ))}
          </div>
        </div>
      )}

      {/* Search results */}
      {results.length > 0 && (
        <div className="divide-y divide-border">
          {results.map((result) => {
            const location = formatLocation(result.city, result.state);
            return (
              <div key={result.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="h-11 w-11 flex-shrink-0">
                    <AvatarImage src={result.profile_image} />
                    <AvatarFallback className="text-sm">
                      {result.name?.substring(0, 2).toUpperCase() || 'UN'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{result.name || 'Unknown User'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.username ? `@${result.username}` : ''}
                    </p>
                    {(result.mutualConnections ?? 0) > 0 && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Users className="h-3 w-3" />
                        {result.mutualConnections} mutual
                      </p>
                    )}
                    {location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {location}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {result.username && (
                    <button
                      onClick={() => handleShare(result.username, result.name)}
                      className="p-2 text-muted-foreground hover:text-foreground touch-manipulation"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  )}
                  {result.connectionStatus === 'connected' && (
                    <Badge variant="secondary" className="text-xs">Connected</Badge>
                  )}
                  {result.connectionStatus === 'pending' && (
                    <Badge variant="outline" className="text-xs">Sent</Badge>
                  )}
                  {result.connectionStatus === 'none' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs h-8 px-4"
                      onClick={() => handleSendConnectionRequest(result.id, result.name)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state → Invite pivot */}
      {showEmptyState && (
        <div className="text-center py-10 space-y-3">
          <p className="text-muted-foreground text-sm">
            No one found for "{searchTerm}"
          </p>
          <p className="text-muted-foreground text-xs">
            Try searching by first name or email address
          </p>
          {onInvite && (
            <Button
              variant="outline"
              className="rounded-full mt-2"
              onClick={() => onInvite(searchTerm)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite "{searchTerm}" to Elyphant
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedConnectionSearch;
