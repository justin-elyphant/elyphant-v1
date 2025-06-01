
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, Heart, Clock } from "lucide-react";
import BotButton from "@/components/ai-gift-advisor/BotButton";
import GiftAdvisorBot from "@/components/ai-gift-advisor/GiftAdvisorBot";

const NicoleIntroSection = () => {
  const [botOpen, setBotOpen] = useState(false);

  const features = [
    {
      icon: <Heart className="h-5 w-5 text-purple-600" />,
      text: "Personalized gift recommendations"
    },
    {
      icon: <Sparkles className="h-5 w-5 text-purple-600" />,
      text: "Budget-friendly suggestions"
    },
    {
      icon: <Clock className="h-5 w-5 text-purple-600" />,
      text: "Occasion-specific ideas"
    }
  ];

  return (
    <>
      <div className="py-16 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Header */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Meet Nicole
              </h2>
            </div>

            {/* Description */}
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Your personal AI gift shopping assistant. Nicole helps you find the perfect gifts 
              for any occasion, person, or budget in seconds.
            </p>

            {/* Features */}
            <div className="flex flex-wrap justify-center gap-6 mb-10">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                  {feature.icon}
                  <span className="text-gray-700 font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* What you can ask */}
            <div className="bg-white rounded-2xl p-8 shadow-lg mb-10 max-w-3xl mx-auto">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">What can you ask Nicole?</h3>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <span className="text-gray-600">"Find gifts for my mom under $50"</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <span className="text-gray-600">"What's good for a housewarming party?"</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <span className="text-gray-600">"Anniversary gift ideas for couples"</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <span className="text-gray-600">"Unique gifts for tech lovers"</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <span className="text-gray-600">"Last-minute birthday gifts"</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <span className="text-gray-600">"Holiday gifts for coworkers"</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-4">
              <Button
                size="lg"
                onClick={() => setBotOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Bot className="mr-2 h-5 w-5" />
                Start Shopping with Nicole
              </Button>
              <p className="text-sm text-gray-500">
                It's free and takes less than 30 seconds
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Gift Advisor Bot Modal */}
      <GiftAdvisorBot 
        isOpen={botOpen} 
        onClose={() => setBotOpen(false)} 
      />
    </>
  );
};

export default NicoleIntroSection;
