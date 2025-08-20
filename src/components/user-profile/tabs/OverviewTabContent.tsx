
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Profile } from "@/types/profile";
import EnhancedInterestsSection from "../EnhancedInterestsSection";
import EnhancedImportantDatesSection from "../EnhancedImportantDatesSection";
import GiftSuggestionsPreview from "../GiftSuggestionsPreview";

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

      {/* Enhanced interests with gift context */}
      <EnhancedInterestsSection 
        interests={displayInterests} 
        isOwnProfile={isOwnProfile}
        userName={profile.name}
      />

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

      {/* Enhanced important dates with gift timing */}
      {importantDates && importantDates.length > 0 && (
        <EnhancedImportantDatesSection 
          importantDates={importantDates}
          isOwnProfile={isOwnProfile}
        />
      )}

      {/* Gift suggestions preview for other users */}
      {!isOwnProfile && displayInterests && displayInterests.length > 0 && (
        <GiftSuggestionsPreview 
          interests={displayInterests}
          profileId={profile.id}
          profileName={profile.name || 'User'}
          isOwnProfile={isOwnProfile}
          wishlistItems={profile.wishlists || []}
        />
      )}
    </div>
  );
};

export default OverviewTabContent;
