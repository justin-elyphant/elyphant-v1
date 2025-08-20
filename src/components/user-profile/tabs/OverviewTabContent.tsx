
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

  // Debug: Log profile.wishlists structure with comprehensive debugging
  console.log('🔍 OverviewTabContent - Full Profile Debug:', {
    profileName: profile.name,
    profileId: profile.id,
    profileKeys: Object.keys(profile),
    hasWishlists: !!profile.wishlists,
    wishlistsType: typeof profile.wishlists,
    wishlistsIsArray: Array.isArray(profile.wishlists),
    wishlistsLength: profile.wishlists?.length || 0,
    rawWishlists: profile.wishlists
  });

  // Enhanced debugging for wishlist items structure
  if (Array.isArray(profile.wishlists)) {
    const wishlistAnalysis = profile.wishlists.map((w, i) => ({
      index: i,
      title: w?.title,
      id: w?.id,
      hasItems: !!(w?.items && Array.isArray(w.items)),
      itemCount: w?.items?.length || 0,
      sampleItem: w?.items?.[0] || null,
      itemKeys: w?.items?.[0] ? Object.keys(w.items[0]) : [],
      fullItems: w?.items
    }));
    
    console.log('🔍 OverviewTabContent - Wishlist Analysis:', wishlistAnalysis);
    
    const totalItems = profile.wishlists.reduce((total, w) => total + (w?.items?.length || 0), 0);
    console.log(`🚨 WISHLIST ITEMS COUNT: ${profile.name} has ${profile.wishlists.length} wishlists with ${totalItems} total items`);
    
    // Show alert for immediate feedback
    if (totalItems > 0) {
      alert(`DEBUG: Found ${totalItems} wishlist items for ${profile.name}`);
    }
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
