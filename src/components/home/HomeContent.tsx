
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Users, ShoppingBag, Settings, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import DataFlowTester from "../diagnostics/DataFlowTester";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

const HomeContent = () => {
  const { user } = useAuth();
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const handleToggleDiagnostics = () => {
    setShowDiagnostics(!showDiagnostics);
    if (!showDiagnostics) {
      toast.info("Diagnostics activated", {
        description: "Running data flow tests to ensure consistency"
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Welcome to Gift Giver</h2>
          {user && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleToggleDiagnostics}
            >
              <Activity className="h-4 w-4 mr-2" />
              {showDiagnostics ? "Hide Diagnostics" : "Diagnostics"}
            </Button>
          )}
        </div>
        <p className="text-muted-foreground">
          Find the perfect gifts for your loved ones and manage your own wishlist.
        </p>
      </section>

      {user && showDiagnostics && (
        <div className="mb-8">
          <DataFlowTester />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Marketplace
            </CardTitle>
            <CardDescription>Browse gift ideas and trending products</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Discover curated gifts for every occasion and budget. Save items to your wishlist or buy directly.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/marketplace">Explore Marketplace</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="h-5 w-5 mr-2" />
              Wishlists
            </CardTitle>
            <CardDescription>Create and manage your wishlists</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Add items you'd love to receive and share your wishlist with friends and family.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link to="/wishlists">View Wishlists</Link>
            </Button>
          </CardFooter>
        </Card>

        {user && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Connections
                </CardTitle>
                <CardDescription>Manage your friend connections</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Connect with friends to share wishlists and gift preferences.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/connections">View Connections</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Settings
                </CardTitle>
                <CardDescription>Manage your account and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Update your profile, privacy settings, and notification preferences.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/settings">Manage Settings</Link>
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default HomeContent;
