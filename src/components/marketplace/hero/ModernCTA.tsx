
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Gift, Heart, Users, Star, TrendingUp, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EnhancedAuthModal from "@/components/auth/enhanced/EnhancedAuthModalV2";

const ModernCTA: React.FC = () => {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signup");

  const features = [
    { icon: Heart, text: "Save favorites", color: "text-pink-500" },
    { icon: Gift, text: "Smart recommendations", color: "text-purple-500" },
    { icon: Users, text: "Share with friends", color: "text-blue-500" },
  ];

  const quickBrowse = [
    { label: "For Him", category: "men" },
    { label: "For Her", category: "women" },
    { label: "Kids", category: "kids" },
    { label: "Home", category: "home" },
  ];

  return (
    <div className="max-w-md mx-auto">
      {/* Main CTA Card */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">
        {/* Header with social proof */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-3 border-b border-purple-100">
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-purple-700 font-medium">50K+ gifts found today</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              <span className="text-gray-600 text-xs">4.9/5 rating</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Start Your Gift Journey
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Join thousands finding perfect gifts with AI-powered recommendations
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {features.map((feature, idx) => (
              <div key={idx} className="text-center">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <span className="text-xs text-gray-600 font-medium">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button 
              size="lg" 
              style={{ background: 'linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%)' }}
              className="w-full text-white font-semibold shadow-lg hover:opacity-90"
              onClick={() => {
                setAuthModalMode("signup");
                setShowAuthModal(true);
              }}
            >
              <Gift className="mr-2 h-5 w-5" />
              Get Started Free
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
              onClick={() => {
                setAuthModalMode("signin");
                setShowAuthModal(true);
              }}
            >
              Sign In
            </Button>
          </div>

          {/* Quick browse */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center mb-3">Or browse by category:</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {quickBrowse.map((item, idx) => (
                <button
                  key={idx}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded-full transition-colors"
                  onClick={() => navigate(`/marketplace?category=${item.category}`)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom trust indicator */}
        <div className="bg-gray-50 px-6 py-2 text-center">
          <p className="text-xs text-gray-500">
            🔒 Secure checkout • Free shipping over $50 • 30-day returns
          </p>
        </div>
      </div>

      <EnhancedAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />
    </div>
  );
};

export default ModernCTA;
