import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Gift, Users, Calendar, DollarSign, Trash2, Edit } from "lucide-react";
import { useGiftingData, RecipientProfile } from "@/hooks/useGiftingData";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { Profile } from "@/types/profile";

const GiftingPreferencesSection = () => {
  const { getRecipientProfiles, getAIGiftSearches } = useGiftingData();
  const { profile } = useProfile();
  const [recipients, setRecipients] = useState<RecipientProfile[]>([]);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGiftingData();
  }, []);

  const loadGiftingData = async () => {
    setLoading(true);
    try {
      const [recipientData, searchData] = await Promise.all([
        getRecipientProfiles(),
        getAIGiftSearches()
      ]);
      setRecipients(recipientData);
      setSearchHistory(searchData);
    } catch (error) {
      console.error("Error loading gifting data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cast profile to the correct type and safely access the properties with fallbacks
  const typedProfile = profile as Profile;
  const giftingPrefs = typedProfile?.gift_giving_preferences || {
    occasions: [],
    budget_ranges: {},
    recipient_types: [],
    preferred_categories: []
  };
  
  const aiData = typedProfile?.ai_interaction_data || {
    preferred_flow: null,
    common_recipients: [],
    learned_preferences: {}
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Gifting Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading your gifting data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Saved Recipients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Saved Recipients
          </CardTitle>
          <CardDescription>
            People you frequently give gifts to
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recipients.length > 0 ? (
            <div className="grid gap-4">
              {recipients.map((recipient) => (
                <div key={recipient.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{recipient.name}</span>
                      <Badge variant="outline">{recipient.relationship}</Badge>
                    </div>
                    {recipient.age_range && (
                      <span className="text-sm text-gray-500">Age: {recipient.age_range}</span>
                    )}
                    {recipient.interests && recipient.interests.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {recipient.interests.slice(0, 3).map((interest) => (
                          <Badge key={interest} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No saved recipients yet. Use the AI Gift Helper to start building your recipient list!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferred Occasions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Preferred Occasions
          </CardTitle>
          <CardDescription>
            Occasions you commonly shop for
          </CardDescription>
        </CardHeader>
        <CardContent>
          {giftingPrefs.occasions && giftingPrefs.occasions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {giftingPrefs.occasions.map((occasion: string) => (
                <Badge key={occasion} variant="outline">
                  {occasion}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No occasion preferences saved yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Preferences
          </CardTitle>
          <CardDescription>
            Your typical spending ranges
          </CardDescription>
        </CardHeader>
        <CardContent>
          {giftingPrefs.budget_ranges ? (
            <div className="space-y-3">
              {giftingPrefs.budget_ranges.preferred_min && giftingPrefs.budget_ranges.preferred_max && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Preferred Range</span>
                  <Badge variant="outline">
                    ${giftingPrefs.budget_ranges.preferred_min} - ${giftingPrefs.budget_ranges.preferred_max}
                  </Badge>
                </div>
              )}
              {giftingPrefs.budget_ranges.last_budget && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Last Used</span>
                  <Badge variant="outline">
                    ${giftingPrefs.budget_ranges.last_budget.min} - ${giftingPrefs.budget_ranges.last_budget.max}
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No budget preferences saved yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Gift Search History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Recent AI Searches
          </CardTitle>
          <CardDescription>
            Your recent gift search sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {searchHistory.length > 0 ? (
            <div className="space-y-3">
              {searchHistory.slice(0, 5).map((search) => (
                <div key={search.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{search.search_query || "Gift Search"}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(search.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {search.occasion && (
                      <Badge variant="secondary" className="text-xs">{search.occasion}</Badge>
                    )}
                    {search.budget_range && (
                      <Badge variant="secondary" className="text-xs">
                        ${search.budget_range.min}-${search.budget_range.max}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No search history yet. Try the AI Gift Helper to get started!
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Learning Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>AI Learning Settings</CardTitle>
          <CardDescription>
            Control how the AI learns from your interactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Save search preferences</div>
              <div className="text-sm text-gray-500">Allow AI to remember your gift preferences</div>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Smart suggestions</div>
              <div className="text-sm text-gray-500">Get personalized gift recommendations</div>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GiftingPreferencesSection;
