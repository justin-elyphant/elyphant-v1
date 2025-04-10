
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag, LogIn, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { setZincApiToken, getZincApiToken } from "./zincCore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ZincConnectCard = () => {
  const [token, setToken] = useState(getZincApiToken() || "");
  const [isConnecting, setIsConnecting] = useState(false);
  const [showTestModeAlert, setShowTestModeAlert] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if we should show the test mode alert
    const currentToken = getZincApiToken();
    setShowTestModeAlert(!currentToken || currentToken.trim() === '');
  }, []);
  
  const handleConnect = () => {
    if (!token || token.length < 10) {
      toast.error("Please enter a valid Zinc API token");
      return;
    }
    
    setIsConnecting(true);
    
    // Save the token
    setZincApiToken(token);
    
    toast.success("Zinc API token saved", {
      description: "You're ready to start using the Zinc API"
    });
    
    // Hide the test mode alert
    setShowTestModeAlert(false);
    
    // Redirect to vendor management
    setTimeout(() => {
      navigate("/vendor-management?tab=integrations");
      setIsConnecting(false);
    }, 1000);
  };
  
  const navigateToVendorPortal = () => {
    navigate("/vendor-management?tab=integrations");
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50">
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-zinc-800" />
          Connect to Zinc API
        </CardTitle>
        <CardDescription>
          Use Zinc to access Amazon's vast product catalog
        </CardDescription>
      </CardHeader>
      {showTestModeAlert && (
        <Alert className="mx-6 mt-6 bg-amber-50 border-amber-200">
          <AlertTitle className="text-amber-800">Test Mode Active</AlertTitle>
          <AlertDescription className="text-amber-700">
            You're currently in test mode using mock data. Enter your Zinc API token below to search real products.
          </AlertDescription>
        </Alert>
      )}
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="zinc-token">Zinc Client Token</Label>
          <Input
            id="zinc-token"
            type="password"
            placeholder="Enter your Zinc client token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Enter the client token provided by Zinc to connect. For testing, you can use the token: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">test_zinc_sk_abcdefgh123456</code>
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 justify-between">
        <Button 
          variant="outline" 
          onClick={navigateToVendorPortal}
          className="flex items-center gap-1"
        >
          <ExternalLink className="h-4 w-4" />
          Advanced Settings
        </Button>
        <Button 
          onClick={handleConnect}
          disabled={isConnecting || !token || token.length < 10}
          className="flex items-center gap-1"
        >
          <LogIn className="h-4 w-4" />
          {isConnecting ? "Connecting..." : "Connect"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ZincConnectCard;
