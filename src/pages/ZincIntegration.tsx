
import React from "react";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import Header from "@/components/home/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Settings, Zap } from "lucide-react";

const ZincIntegration = () => {
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
      <Header />
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Zinc API Integration</h1>
          <p className="text-muted-foreground">
            Manage your Amazon product integration and automated purchasing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <Package className="h-12 w-12 mx-auto mb-2 text-orange-600" />
              <CardTitle>Product Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Automatically sync Amazon products to your marketplace
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Zap className="h-12 w-12 mx-auto mb-2 text-yellow-600" />
              <CardTitle>Auto Purchase</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Enable automated gift purchasing through Amazon
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Settings className="h-12 w-12 mx-auto mb-2 text-gray-600" />
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Set up your Amazon credentials and preferences
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Zinc API Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground mb-4">
                Zinc API integration is coming soon!
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                This will enable seamless Amazon product integration and automated purchasing capabilities.
              </p>
              <Button onClick={() => navigate("/marketplace")}>
                Browse Marketplace
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ZincIntegration;
