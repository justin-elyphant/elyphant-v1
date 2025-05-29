
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, Heart, Gift, ArrowRight } from "lucide-react";
import { useGiftAdvisorBot } from "../hooks/useGiftAdvisorBot";
import { useNavigate } from "react-router-dom";

type SignUpPromptStepProps = ReturnType<typeof useGiftAdvisorBot>;

const SignUpPromptStep = ({ closeBot }: SignUpPromptStepProps) => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    closeBot();
    navigate("/signup");
  };

  const handleSignIn = () => {
    closeBot();
    navigate("/signin");
  };

  const handleBack = () => {
    // Go back to recipient selection
    closeBot();
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-yellow-500" />
          <h3 className="text-xl font-bold text-gray-900">Unlock Premium Features</h3>
          <Sparkles className="h-6 w-6 text-yellow-500" />
        </div>
        <p className="text-sm text-gray-600">
          Sign up to access friend wishlists and get personalized recommendations!
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-purple-800">Friend-Based Shopping</span>
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
              Premium
            </Badge>
          </div>
          <p className="text-sm text-purple-700">
            Shop directly from your friends' wishlists and get recommendations based on their actual preferences.
          </p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-3 mb-3">
            <Heart className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-green-800">Personalized AI</span>
          </div>
          <p className="text-sm text-green-700">
            Get smarter recommendations powered by your connections' gift preferences and past purchase history.
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <Gift className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-blue-800">Save & Organize</span>
          </div>
          <p className="text-sm text-blue-700">
            Save your gift searches, create shopping lists, and never lose track of perfect gift ideas.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg border">
        <p className="text-xs text-gray-600 text-center">
          ✨ Join thousands of users finding perfect gifts faster with AI
        </p>
      </div>

      <div className="space-y-3 flex-1 flex flex-col justify-end">
        <Button 
          onClick={handleSignUp}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          Sign Up & Unlock Features
        </Button>

        <Button 
          onClick={handleSignIn}
          variant="outline"
          className="w-full hover:bg-purple-50 hover:border-purple-300"
        >
          Already have an account? Sign In
        </Button>

        <Button 
          onClick={handleBack}
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700"
        >
          ← Go Back
        </Button>
      </div>
    </div>
  );
};

export default SignUpPromptStep;
