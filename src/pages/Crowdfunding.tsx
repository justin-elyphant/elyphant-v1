
import React from "react";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import UnifiedShopperHeader from "@/components/navigation/UnifiedShopperHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Heart, TrendingUp } from "lucide-react";

const Crowdfunding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) {
      navigate("/sign-in");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <UnifiedShopperHeader />
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Group Gifting & Crowdfunding</h1>
          <p className="text-muted-foreground">
            Pool resources with friends and family to give amazing gifts together
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto mb-2 text-blue-600" />
              <CardTitle>Group Gifts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Create campaigns for group gifts and invite others to contribute
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Heart className="h-12 w-12 mx-auto mb-2 text-red-600" />
              <CardTitle>Special Occasions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Perfect for weddings, birthdays, and milestone celebrations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 text-green-600" />
              <CardTitle>Track Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Monitor contributions and celebrate when goals are reached
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground mb-4">
                Crowdfunding features are coming soon!
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Soon you'll be able to create group gift campaigns, invite contributors, and make gifting a collaborative experience.
              </p>
              <Button onClick={() => navigate("/dashboard?tab=auto-gifts")}>
                Explore Individual Gifts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Crowdfunding;
