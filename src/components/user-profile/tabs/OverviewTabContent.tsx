
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Profile } from "@/types/profile";
import ImportantDatesSection from "../ImportantDatesSection";

interface OverviewTabContentProps {
  profile: Profile | null;
  isOwnProfile: boolean;
}

const OverviewTabContent: React.FC<OverviewTabContentProps> = ({ profile, isOwnProfile }) => {
  if (!profile) {
    return <div>Loading profile...</div>;
  }

  // Get interests from the profile (primary source)
  const displayInterests = profile.interests || [];
  
  // Get important dates from the profile
  const importantDates = profile.important_dates || [];

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

      {/* Show interests as the primary gift preferences */}
      {displayInterests && displayInterests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {displayInterests.map((interest, index) => (
                <div key={index} className="bg-muted px-3 py-1 rounded-full text-sm">
                  {typeof interest === 'string' ? interest : interest}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fallback to gift_preferences if no interests */}
      {(!displayInterests || displayInterests.length === 0) && 
       profile.gift_preferences && profile.gift_preferences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gift Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.gift_preferences.map((pref, index) => (
                <div key={index} className="bg-muted px-3 py-1 rounded-full text-sm">
                  {typeof pref === 'string' ? pref : pref.category}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show important dates if available */}
      {importantDates && importantDates.length > 0 && (
        <ImportantDatesSection importantDates={importantDates} />
      )}
    </div>
  );
};

export default OverviewTabContent;
