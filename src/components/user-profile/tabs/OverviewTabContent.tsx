
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

  // Debug: Log profile.wishlists structure
  console.log('🔍 OverviewTabContent - Profile wishlists:', {
    wishlists: profile.wishlists,
    type: typeof profile.wishlists,
    isArray: Array.isArray(profile.wishlists),
    length: profile.wishlists?.length || 0,
    keys: profile.wishlists ? Object.keys(profile.wishlists) : [],
    firstItem: profile.wishlists?.[0] || null
  });

  // Enhanced debugging for wishlist items structure
  console.log('🔍 OverviewTabContent - Enhanced wishlist debugging:', {
    profileName: profile.name,
    profileId: profile.id,
    hasWishlists: !!profile.wishlists,
    wishlistsStructure: profile.wishlists,
    wishlistAnalysis: Array.isArray(profile.wishlists) ? profile.wishlists.map((w, i) => ({
      index: i,
      title: w?.title,
      id: w?.id,
      hasItems: !!(w?.items && Array.isArray(w.items)),
      itemCount: w?.items?.length || 0,
      sampleItem: w?.items?.[0] || null,
      itemKeys: w?.items?.[0] ? Object.keys(w.items[0]) : []
    })) : 'Not an array'
  });

  // Show immediate alert for debugging
  if (profile.wishlists && Array.isArray(profile.wishlists) && profile.wishlists.length > 0) {
    const itemCount = profile.wishlists.reduce((total, w) => total + (w?.items?.length || 0), 0);
    console.log(`🚨 WISHLIST DEBUG ALERT: ${profile.name} has ${profile.wishlists.length} wishlists with ${itemCount} total items`);
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
