import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useUnifiedProfile } from '@/hooks/useUnifiedProfile';
import { useConnectionsAdapter } from '@/hooks/useConnectionsAdapter';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Gift, MessageSquare, Sparkles, Users, Heart } from 'lucide-react';
import MarketplaceWrapper from './MarketplaceWrapper';
import FloatingNicoleWidget from '@/components/ai/enhanced/FloatingNicoleWidget';
import { format, isToday, isTomorrow } from 'date-fns';

interface UpcomingEvent {
  id: string;
  name: string;
  avatar: string;
  event: string;
  date: Date;
  relationship: string;
}

const StreamlinedMarketplaceWrapper = () => {
  const { user } = useAuth();
  const { profile } = useUnifiedProfile();
  const { friends, loading: connectionsLoading } = useConnectionsAdapter();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [showNicole, setShowNicole] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);

  // Parse URL parameters for modes
  const mode = searchParams.get('mode');
  const nicoleOpen = searchParams.get('open') === 'true';
  const greeting = searchParams.get('greeting');

  // Mock upcoming events from connections
  const upcomingEvents: UpcomingEvent[] = friends.slice(0, 3).map((friend, index) => ({
    id: friend.id,
    name: friend.name,
    avatar: friend.imageUrl || '/placeholder.svg',
    event: ['Birthday', 'Anniversary', 'Graduation'][index],
    date: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000), // 1, 2, 3 weeks from now
    relationship: friend.relationship || 'Friend'
  }));

  // Initialize Nicole AI if requested
  useEffect(() => {
    if (mode === 'nicole' && nicoleOpen) {
      setShowNicole(true);
      // Clear URL params after opening
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('mode');
      newParams.delete('open');
      newParams.delete('greeting');
      setSearchParams(newParams);
    }
  }, [mode, nicoleOpen, searchParams, setSearchParams]);

  const formatEventDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const handleGiftForConnection = (connection: UpcomingEvent) => {
    setSelectedRecipient({
      name: connection.name,
      relationship: connection.relationship,
      occasion: connection.event,
      id: connection.id
    });
    setShowNicole(true);
  };

  const handleCreateWishlist = () => {
    navigate('/my-wishlists?action=create');
  };

  const handleViewConnections = () => {
    navigate('/connections');
  };

  return (
    <div className="space-y-6">
      {/* Connection-Aware Header with Hero Image */}
      {!connectionsLoading && (
        <div className="relative bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg overflow-hidden">
          {/* Hero Image Background */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage: `url('/lovable-uploads/9765a848-d167-4135-b5d0-742e88ad187c.png')`
            }}
          />
          <div className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome to the Marketplace
              </h2>
              {profile?.profile_type === 'giftor' && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
              )}
            </div>
          
          {/* Quick Actions */}
          <Tabs defaultValue="browse" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="browse">Browse Gifts</TabsTrigger>
              <TabsTrigger value="connections">For Friends</TabsTrigger>
              <TabsTrigger value="wishlist">My Wishlist</TabsTrigger>
            </TabsList>
            
            <TabsContent value="browse" className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">
                  Discover best selling gifts and popular items curated just for you
                </p>
                <Button 
                  onClick={() => setShowNicole(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Ask Nicole AI
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="connections" className="mt-4">
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-muted-foreground mb-4">
                    Upcoming events from your connections
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {upcomingEvents.map((event) => (
                      <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleGiftForConnection(event)}>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={event.avatar} />
                              <AvatarFallback>{event.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{event.name}</p>
                              <p className="text-xs text-muted-foreground">{event.event}</p>
                              <div className="flex items-center mt-1">
                                <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {formatEventDate(event.date)}
                                </span>
                              </div>
                            </div>
                            <Gift className="h-4 w-4 text-purple-600" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No upcoming events from your connections
                  </p>
                  <Button variant="outline" onClick={handleViewConnections}>
                    <Users className="h-4 w-4 mr-2" />
                    Find Connections
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="wishlist" className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">
                  Create and manage your wishlists for perfect gifting
                </p>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => navigate('/my-wishlists')}>
                    <Heart className="h-4 w-4 mr-2" />
                    View Wishlists
                  </Button>
                  <Button onClick={handleCreateWishlist}>
                    <Heart className="h-4 w-4 mr-2" />
                    Create Wishlist
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          </div>
        </div>
      )}

      {/* Main Marketplace */}
      <MarketplaceWrapper />

      {/* Nicole AI Widget - Mobile Only */}
      {showNicole && isMobile && (
        <FloatingNicoleWidget
          onNavigateToResults={(query) => {
            // Handle search results navigation
            console.log('Navigating to search results:', query);
          }}
          defaultMinimized={false}
        />
      )}
    </div>
  );
};

export default StreamlinedMarketplaceWrapper;