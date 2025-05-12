
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Mail } from "lucide-react";
import { EmailContactsButton } from "@/components/connections/EmailContactsButton";

interface OnboardingConnectionsProps {
  onNext: () => void;
  onSkip: () => void;
}

const OnboardingConnections: React.FC<OnboardingConnectionsProps> = ({ onNext, onSkip }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Connect with friends</h2>
        <p className="text-muted-foreground">
          Find people you know and start sharing gift ideas.
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Email Contacts</CardTitle>
            <CardDescription>
              Import your contacts from your email to find friends.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailContactsButton />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Invite Friends</CardTitle>
            <CardDescription>
              Invite friends to join you on Gift Giver.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              Send Invitations
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Find Friends</CardTitle>
            <CardDescription>
              Search for people you may know by name or username.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <UserPlus className="mr-2 h-4 w-4" />
              Find Friends
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onSkip}>
          Skip for now
        </Button>
        <Button onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default OnboardingConnections;
