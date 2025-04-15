
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileHeaderProps {
  profile: any;
  isCurrentUser: boolean;
}

const ProfileHeader = ({ profile, isCurrentUser }: ProfileHeaderProps) => {
  return (
    <div className="mb-6">
      <Button variant="ghost" asChild className="p-0">
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </Button>
      
      {/* Optionally use the profile data if needed */}
      {profile && (
        <div className="mt-2 text-sm text-muted-foreground">
          Viewing {isCurrentUser ? "your" : `${profile.name}'s`} profile
        </div>
      )}
    </div>
  );
};

export default ProfileHeader;
