
import React from "react";
import StandardBackButton from "@/components/shared/StandardBackButton";

interface ProfileHeaderProps {
  profile: any;
  isCurrentUser: boolean;
}

const ProfileHeader = ({ profile, isCurrentUser }: ProfileHeaderProps) => {
  return (
    <div>
      <StandardBackButton 
        to="/dashboard" 
        text="Back to Dashboard" 
      />
      
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
