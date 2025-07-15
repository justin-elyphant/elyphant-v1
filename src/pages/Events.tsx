
import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import SimplifiedEvents from "@/components/events/SimplifiedEvents";
import BackToDashboard from "@/components/shared/BackToDashboard";
import OptimizedLayout from "@/components/layout/OptimizedLayout";
import { useAuth } from "@/contexts/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { EventsProvider } from "@/components/gifting/events/context/EventsContext";

const Events = () => {
  const { user } = useAuth();

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <OptimizedLayout>
        <div className="container mx-auto py-8 px-4">
          <BackToDashboard />
          
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Special Dates</h1>
          </div>

          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Sign in required</h3>
                <p className="text-muted-foreground mb-4">
                  Please sign in to manage your events and gift timing preferences
                </p>
                <Button asChild>
                  <Link to="/sign-in">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </OptimizedLayout>
    );
  }

  return (
    <OptimizedLayout>
      <EventsProvider>
        <div className="container mx-auto py-8 px-4">
          <BackToDashboard />
          <SimplifiedEvents />
        </div>
      </EventsProvider>
    </OptimizedLayout>
  );
};

export default Events;
