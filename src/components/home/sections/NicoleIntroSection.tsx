
import React from "react";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, Heart, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const NicoleIntroSection = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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

  const handleStartShopping = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate("/?mode=nicole&open=true");
  };

  return (
    <div className="relative overflow-hidden">
      {/* Full bleed background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-50" />
      
      {/* Floating decorative elements for immersion */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-purple-200/30 rounded-full blur-xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-indigo-200/30 rounded-full blur-xl" />
      <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-pink-200/30 rounded-full blur-xl" />
      
      <div className="relative py-16 md:py-20">
        <div className={isMobile ? "px-4" : "container mx-auto px-4"}>
          <div className="max-w-4xl mx-auto text-center">
            {/* Header */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full shadow-lg">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Meet Nicole
              </h2>
            </div>

            {/* Description */}
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Your personal AI gift shopping assistant. Nicole helps you find the perfect gifts 
              for any occasion, person, or budget in seconds.
            </p>

            {/* Features */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-10">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-full shadow-sm border border-white/50">
                  {feature.icon}
                  <span className="text-gray-700 font-medium text-sm md:text-base">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* What you can ask - Enhanced for mobile */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl mb-10 max-w-3xl mx-auto border border-white/50">
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6">What can you ask Nicole?</h3>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600 text-sm md:text-base">"Find gifts for my mom under $50"</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600 text-sm md:text-base">"What's good for a housewarming party?"</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600 text-sm md:text-base">"Anniversary gift ideas for couples"</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600 text-sm md:text-base">"Unique gifts for tech lovers"</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600 text-sm md:text-base">"Last-minute birthday gifts"</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600 text-sm md:text-base">"Holiday gifts for coworkers"</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA - Enhanced for mobile */}
            <div className="space-y-4">
              <Button
                size="lg"
                onClick={handleStartShopping}
                className={`bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 touch-target-48 ${isMobile ? "text-lg px-8 py-6 rounded-xl w-full max-w-sm" : "text-lg px-8 py-6 rounded-xl"}`}
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
    </div>
  );
};

export default NicoleIntroSection;
