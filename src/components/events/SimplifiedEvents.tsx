import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Plus, Gift, Clock, Users, Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEvents } from "@/components/gifting/events/context/EventsContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const SimplifiedEvents = () => {
  const isMobile = useIsMobile();
  const { events, isLoading } = useEvents();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const upcomingEvents = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return events
      .filter(event => {
        if (!event.dateObj) return false;
        const matchesSearch = event.person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             event.type?.toLowerCase().includes(searchTerm.toLowerCase());
        return event.dateObj >= today && matchesSearch;
      })
      .map(event => ({
        ...event,
        daysAway: Math.ceil((event.dateObj!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      }))
      .sort((a, b) => a.dateObj!.getTime() - b.dateObj!.getTime());
  }, [events, searchTerm]);

  const pastEvents = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return events
      .filter(event => {
        if (!event.dateObj) return false;
        const matchesSearch = event.person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             event.type?.toLowerCase().includes(searchTerm.toLowerCase());
        return event.dateObj < today && matchesSearch;
      })
      .sort((a, b) => b.dateObj!.getTime() - a.dateObj!.getTime())
      .slice(0, 5);
  }, [events, searchTerm]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Special Dates</h1>
          <p className="text-muted-foreground">Never miss a gift-giving opportunity</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Special Date</DialogTitle>
            </DialogHeader>
            <AddEventForm onSuccess={() => setShowAddDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Gift className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-semibold">Shop for Gifts</h3>
                <p className="text-sm text-muted-foreground">Browse marketplace</p>
              </div>
            </div>
            <Button asChild className="w-full mt-3" size="sm">
              <Link to="/marketplace">Browse Gifts</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold">Find Friends</h3>
                <p className="text-sm text-muted-foreground">Connect with family</p>
              </div>
            </div>
            <Button asChild className="w-full mt-3" size="sm" variant="outline">
              <Link to="/connections">Find People</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-pink-600" />
              <div>
                <h3 className="font-semibold">Auto-Gift</h3>
                <p className="text-sm text-muted-foreground">Set up reminders</p>
              </div>
            </div>
            <Button asChild className="w-full mt-3" size="sm" variant="outline">
              <Link to="/settings?tab=gifting">Configure</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Upcoming Events
            <Badge variant="secondary">{upcomingEvents.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length > 0 ? (
            <div className={cn(
              "grid gap-4",
              isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"
            )}>
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{event.person}</h4>
                    {event.daysAway <= 7 && (
                      <Badge variant="outline" className="text-orange-600">
                        {event.daysAway === 0 ? 'Today' : 
                          event.daysAway === 1 ? 'Tomorrow' : 
                          `${event.daysAway} days`}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{event.type}</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {event.dateObj ? format(event.dateObj, 'MMM d, yyyy') : event.date}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/marketplace?search=${encodeURIComponent(event.type + ' gifts')}`}>
                        Shop Gifts
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost">
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h4 className="font-medium mb-2">No upcoming events</h4>
              <p className="text-sm text-muted-foreground">Add special dates to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              Recent Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{event.person}</p>
                    <p className="text-sm text-muted-foreground">{event.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {event.dateObj ? format(event.dateObj, 'MMM d, yyyy') : event.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Simple Add Event Form
const AddEventForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    person: "",
    type: "",
    date: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual event creation
    console.log("Creating event:", formData);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="person">Person</Label>
        <Input
          id="person"
          value={formData.person}
          onChange={(e) => setFormData(prev => ({ ...prev, person: e.target.value }))}
          placeholder="e.g., Mom, John, Sarah"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="type">Event Type</Label>
        <Input
          id="type"
          value={formData.type}
          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
          placeholder="e.g., Birthday, Anniversary"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
          required
        />
      </div>
      
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">Add Event</Button>
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default SimplifiedEvents;