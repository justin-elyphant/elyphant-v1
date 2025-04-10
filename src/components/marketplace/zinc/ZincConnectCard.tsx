
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag, LogIn, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { setZincApiToken, getZincApiToken } from "./zincCore";

const ZincConnectCard = () => {
  const [token, setToken] = useState(getZincApiToken() || "");
  const [isConnecting, setIsConnecting] = useState(false);
  const navigate = useNavigate();
  
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
            Enter the client token provided by Zinc to connect.
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
