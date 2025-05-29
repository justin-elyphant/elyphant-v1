
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, ArrowRight, Brain } from "lucide-react";
import { useGiftAdvisorBot } from "../ai-gift-advisor/hooks/useGiftAdvisorBot";
import GiftAdvisorBot from "../ai-gift-advisor/GiftAdvisorBot";

const SimplifiedGiftorOnboarding = () => {
  const navigate = useNavigate();
  const { isOpen, openBot, closeBot, ...botProps } = useGiftAdvisorBot();

  const handleSearchOnOwn = () => {
    navigate("/marketplace");
  };

  const handleUseAIHelper = () => {
    openBot();
  };

  return (
    <>
      <div className="p-6 md:p-8">
        {/* Header that references the previous onboarding question */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Perfect! How would you like to find gifts?
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the approach that works best for you. You can always switch between both methods later.
          </p>
        </div>

        {/* Two Main Options - Responsive Grid */}
        <div className="grid gap-4 md:gap-6 max-w-4xl mx-auto">
          {/* Search on My Own Option */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-300 cursor-pointer group">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                    <Search className="h-6 w-6 md:h-7 md:w-7 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg md:text-xl">Browse marketplace</CardTitle>
                  <CardDescription className="text-sm md:text-base mt-1">
                    Explore our curated collection and discover gifts at your own pace
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-gray-600">
                  Perfect for those who enjoy browsing and exploring
                </div>
                <Button 
                  onClick={handleSearchOnOwn}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  Start Browsing
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Helper Option */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-300 cursor-pointer group relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI Powered
              </div>
            </div>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full group-hover:from-purple-200 group-hover:to-pink-200 transition-colors">
                    <Brain className="h-6 w-6 md:h-7 md:w-7 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pr-16">
                  <CardTitle className="text-lg md:text-xl">Get AI recommendations</CardTitle>
                  <CardDescription className="text-sm md:text-base mt-1">
                    Answer a few questions and get personalized gift suggestions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-gray-600">
                  Smart assistant that learns your preferences over time
                </div>
                <Button 
                  onClick={handleUseAIHelper}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full sm:w-auto"
                >
                  Get AI Help
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Optional footer note */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Don't worry - you can always try the other approach later from your dashboard
          </p>
        </div>
      </div>

      {/* AI Gift Advisor Bot Modal */}
      <GiftAdvisorBot isOpen={isOpen} onClose={closeBot} />
    </>
  );
};

export default SimplifiedGiftorOnboarding;
