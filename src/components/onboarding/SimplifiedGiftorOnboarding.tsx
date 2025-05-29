
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, ArrowRight, Gift, Users, Brain } from "lucide-react";
import { useGiftAdvisorBot } from "../ai-gift-advisor/hooks/useGiftAdvisorBot";

const SimplifiedGiftorOnboarding = () => {
  const navigate = useNavigate();
  const { openBot } = useGiftAdvisorBot();

  const handleSearchOnOwn = () => {
    navigate("/marketplace");
  };

  const handleUseAIHelper = () => {
    openBot();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gift className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Welcome to Elyphant!</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Ready to find the perfect gifts? Choose how you'd like to start your gifting journey.
          </p>
        </div>

        {/* Two Main Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Search on My Own Option */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-300 cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                  <Search className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-xl">Search on my own</CardTitle>
              <CardDescription className="text-base">
                Browse our marketplace and discover gifts at your own pace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>Thousands of curated products</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Search className="h-4 w-4" />
                  <span>Advanced search and filters</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Gift className="h-4 w-4" />
                  <span>Categories for every occasion</span>
                </div>
              </div>
              <Button 
                onClick={handleSearchOnOwn}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Start Browsing
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* AI Helper Option */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
            </div>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                  <Brain className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <CardTitle className="text-xl">Use AI Gift Helper</CardTitle>
              <CardDescription className="text-base">
                Get personalized recommendations with our smart assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Sparkles className="h-4 w-4" />
                  <span>Personalized gift suggestions</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Brain className="h-4 w-4" />
                  <span>Smart questions to understand needs</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Gift className="h-4 w-4" />
                  <span>Learns your preferences over time</span>
                </div>
              </div>
              <Button 
                onClick={handleUseAIHelper}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Get AI Help
                <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="bg-white/70 backdrop-blur rounded-lg p-6 border">
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 mb-2">New to gift giving?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Our AI helper will guide you step-by-step to find the perfect gift, while learning your preferences for future suggestions.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline">Occasion-based suggestions</Badge>
              <Badge variant="outline">Budget-friendly options</Badge>
              <Badge variant="outline">Personality matching</Badge>
              <Badge variant="outline">Trend awareness</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedGiftorOnboarding;
