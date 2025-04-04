
import React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProfileTypeSelectionProps {
  onSelect: (type: string) => void;
}

const ProfileTypeSelection = ({ onSelect }: ProfileTypeSelectionProps) => {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">What brings you here?</CardTitle>
        <CardDescription>
          Tell us how you plan to use our platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={() => onSelect("gifter")}
          variant="outline" 
          className="w-full justify-between h-auto p-4 text-left"
        >
          <div>
            <div className="font-medium">I want to find gifts</div>
            <div className="text-sm text-muted-foreground">Browse and purchase gifts for friends and family</div>
          </div>
          <ArrowRight className="h-5 w-5" />
        </Button>
        
        <Button 
          onClick={() => onSelect("giftee")}
          variant="outline" 
          className="w-full justify-between h-auto p-4 text-left"
        >
          <div>
            <div className="font-medium">I want to create wishlists</div>
            <div className="text-sm text-muted-foreground">Share my gift preferences with others</div>
          </div>
          <ArrowRight className="h-5 w-5" />
        </Button>
        
        <Button 
          onClick={() => onSelect("both")}
          variant="outline" 
          className="w-full justify-between h-auto p-4 text-left"
        >
          <div>
            <div className="font-medium">Both!</div>
            <div className="text-sm text-muted-foreground">I want to find gifts and create wishlists</div>
          </div>
          <ArrowRight className="h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileTypeSelection;
