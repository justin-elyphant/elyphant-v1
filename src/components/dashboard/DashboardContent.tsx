
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Gift, Users, Calendar, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

const DashboardContent = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's an overview of your gift giving activities.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link to="/marketplace">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Browse Gifts
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/my-wishlists">
                <Plus className="h-4 w-4 mr-2" />
                Create Wishlist
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/events">
                <Calendar className="h-4 w-4 mr-2" />
                Add Event
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">No upcoming events</p>
              <Button asChild variant="outline" size="sm">
                <Link to="/events">Add Event</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Connections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">Connect with friends</p>
              <Button asChild variant="outline" size="sm">
                <Link to="/connections">Manage Connections</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardContent;
