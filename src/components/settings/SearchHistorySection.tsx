
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Trash2 } from "lucide-react";
import { useUserSearchHistory } from "@/hooks/useUserSearchHistory";
import { useAuth } from "@/contexts/auth";

const SearchHistorySection = () => {
  const { user } = useAuth();
  const { recentSearches, loading, clearSearchHistory } = useUserSearchHistory();

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Search History
          </CardTitle>
          <CardDescription>
            Sign in to manage your search history across devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            Please sign in to view and manage your search history
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Search History
        </CardTitle>
        <CardDescription>
          Manage your recent searches and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-4 text-gray-500">Loading search history...</div>
        ) : recentSearches.length > 0 ? (
          <>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recent Searches</h4>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term, index) => (
                  <Badge key={index} variant="secondary">
                    {term}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <div>
                <div className="font-medium">Clear Search History</div>
                <div className="text-sm text-gray-500">
                  Remove all saved search terms from your account
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSearchHistory}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No search history yet. Your recent searches will appear here.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchHistorySection;
