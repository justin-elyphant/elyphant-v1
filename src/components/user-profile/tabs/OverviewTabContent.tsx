
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Profile } from "@/types/profile";

interface OverviewTabContentProps {
  profile: Profile | null;
  isOwnProfile: boolean;
}

const OverviewTabContent: React.FC<OverviewTabContentProps> = ({ profile, isOwnProfile }) => {
  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Bio</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.bio ? (
            <p>{profile.bio}</p>
          ) : (
            <p className="text-muted-foreground">
              {isOwnProfile 
                ? "You haven't added a bio yet. Add one in the settings tab!" 
                : "This user hasn't added a bio yet."}
            </p>
          )}
        </CardContent>
      </Card>

      {profile.gift_preferences && profile.gift_preferences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gift Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.gift_preferences.map((pref, index) => (
                <div key={index} className="bg-muted px-3 py-1 rounded-full text-sm">
                  {pref.category}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OverviewTabContent;
