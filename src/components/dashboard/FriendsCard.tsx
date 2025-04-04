
import React from "react";
import { Link } from "react-router-dom";
import { UserRound, Shield, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const FriendsCard = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <UserRound className="h-5 w-5 mr-2 text-orange-500" />
          Friends & Following
        </CardTitle>
        <CardDescription>
          Connect with others securely
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            <p className="mb-2">
              Discover friends' wishlists and follow people with similar interests.
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center text-xs">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Shield className="h-4 w-4 mr-2 text-green-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Privacy focused connections</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span>Private, consent-based data sharing</span>
              </div>
              <div className="flex items-center text-xs">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Share important dates</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span>Birthday and special occasions sharing</span>
              </div>
              <div className="flex items-center text-xs">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <MapPin className="h-4 w-4 mr-2 text-red-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Share shipping details</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span>Optional shipping address sharing</span>
              </div>
            </div>
          </div>
          <Button className="w-full" asChild>
            <Link to="/connections">Manage Connections</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FriendsCard;
