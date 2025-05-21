
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Gift, Heart, User } from "lucide-react";

type Step =
  | "recipient"
  | "occasion"
  | "age"
  | "interests"
  | "budget"
  | "focus"
  | "avoid"
  | "complete";

const steps: Step[] = [
  "recipient",
  "occasion",
  "age",
  "interests",
  "budget",
  "focus",
  "avoid",
  "complete",
];

const recipientOptions = [
  "Friend",
  "Family",
  "Partner",
  "Colleague",
  "Myself",
  "Other"
];

const occasionOptions = [
  "Birthday",
  "Anniversary",
  "Graduation",
  "Holiday",
  "Thank You",
  "Just Because",
  "Custom"
];

const ageOptions = [
  "Child", "Teen", "20s", "30s", "40s", "50+", "Prefer not to say"
];

const interestOptions = [
  "Tech", "Sports", "Cooking", "Fashion", "Books", "Outdoors", "Art", "Music", "Fitness", "Travel"
];

const budgetOptions = [
  "<$25", "$25–$50", "$51–$100", "$100+", "No budget"
];

const focusOptions = [
  "Practical gifts",
  "Fun/unique gifts",
  "Memorable experiences",
  "Popular/bestsellers",
  "Let AI decide"
];

interface StepAnswers {
  recipient: string;
  recipientOther: string;
  occasion: string;
  occasionCustom: string;
  age: string;
  interests: string[];
  interestCustom: string;
  budget: string;
  focus: string;
  avoid: string;
}

const initialAnswers: StepAnswers = {
  recipient: "",
  recipientOther: "",
  occasion: "",
  occasionCustom: "",
  age: "",
  interests: [],
  interestCustom: "",
  budget: "",
  focus: "",
  avoid: "",
};

const OnboardingGiftorFlow: React.FC = () => {
  const navigate = useNavigate();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [answers, setAnswers] = useState<StepAnswers>(initialAnswers);
  const [completed, setCompleted] = useState(false);

  const currentStep = steps[currentStepIdx];
  const progress = (currentStepIdx / (steps.length - 1)) * 100;

  // Wizard step renders
  function renderStep() {
    switch (currentStep) {
      case "recipient":
        return (
          <div className="animate-fade-in p-6 pt-0">
            <h2 className="text-xl font-semibold flex items-center">
              <User className="w-5 h-5 mr-2 text-purple-600" /> Who is this gift for?
            </h2>
            <div className="flex flex-wrap gap-2 mt-5">
              {recipientOptions.map(opt => (
                <Button
                  key={opt}
                  variant={answers.recipient === opt ? "default" : "outline"}
                  size="sm"
                  className="px-4"
                  onClick={() =>
                    setAnswers(prev => ({
                      ...prev,
                      recipient: opt,
                      recipientOther: opt !== "Other" ? "" : prev.recipientOther,
                    }))
                  }
                >
                  {opt}
                </Button>
              ))}
            </div>
            {answers.recipient === "Other" && (
              <input
                className="mt-3 border rounded p-2 w-full"
                placeholder="Type recipient..."
                value={answers.recipientOther}
                onChange={e => setAnswers(prev => ({ ...prev, recipientOther: e.target.value }))}
              />
            )}
          </div>
        );
      case "occasion":
        return (
          <div className="animate-fade-in p-6 pt-0">
            <h2 className="text-xl font-semibold flex items-center">
              <Gift className="w-5 h-5 mr-2 text-pink-500" /> What's the occasion?
            </h2>
            <div className="flex flex-wrap gap-2 mt-5">
              {occasionOptions.map(opt => (
                <Button
                  key={opt}
                  variant={answers.occasion === opt ? "default" : "outline"}
                  size="sm"
                  className="px-4"
                  onClick={() =>
                    setAnswers(prev => ({
                      ...prev,
                      occasion: opt,
                      occasionCustom: opt !== "Custom" ? "" : prev.occasionCustom
                    }))
                  }
                >
                  {opt}
                </Button>
              ))}
            </div>
            {answers.occasion === "Custom" && (
              <input
                className="mt-3 border rounded p-2 w-full"
                placeholder="Describe the occasion..."
                value={answers.occasionCustom}
                onChange={e => setAnswers(prev => ({ ...prev, occasionCustom: e.target.value }))}
              />
            )}
          </div>
        );
      case "age":
        return (
          <div className="animate-fade-in p-6 pt-0">
            <h2 className="text-xl font-semibold flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-yellow-400" /> How old is the recipient?
            </h2>
            <div className="flex flex-wrap gap-2 mt-5">
              {ageOptions.map(opt => (
                <Button
                  key={opt}
                  variant={answers.age === opt ? "default" : "outline"}
                  size="sm"
                  className="px-4"
                  onClick={() => setAnswers(prev => ({ ...prev, age: opt }))}
                >
                  {opt}
                </Button>
              ))}
            </div>
          </div>
        );
      case "interests":
        return (
          <div className="animate-fade-in p-6 pt-0">
            <h2 className="text-xl font-semibold flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-500" /> What are they into?
            </h2>
            <div className="flex flex-wrap gap-2 mt-5">
              {interestOptions.map(opt => (
                <Button
                  key={opt}
                  variant={answers.interests.includes(opt) ? "default" : "outline"}
                  size="sm"
                  className="px-4"
                  onClick={() =>
                    setAnswers(prev => ({
                      ...prev,
                      interests: prev.interests.includes(opt)
                        ? prev.interests.filter(i => i !== opt)
                        : [...prev.interests, opt]
                    }))
                  }
                >
                  {opt}
                </Button>
              ))}
            </div>
            <input
              className="mt-4 border rounded p-2 w-full"
              placeholder="Or type your own interests (comma separated)..."
              value={answers.interestCustom}
              onChange={e => setAnswers(prev => ({ ...prev, interestCustom: e.target.value }))}
            />
          </div>
        );
      case "budget":
        return (
          <div className="animate-fade-in p-6 pt-0">
            <h2 className="text-xl font-semibold flex items-center">
              <Gift className="w-5 h-5 mr-2 text-green-500" /> What is your budget?
            </h2>
            <div className="flex flex-wrap gap-2 mt-5">
              {budgetOptions.map(opt => (
                <Button
                  key={opt}
                  variant={answers.budget === opt ? "default" : "outline"}
                  size="sm"
                  className="px-4"
                  onClick={() => setAnswers(prev => ({ ...prev, budget: opt }))}
                >
                  {opt}
                </Button>
              ))}
            </div>
          </div>
        );
      case "focus":
        return (
          <div className="animate-fade-in p-6 pt-0">
            <h2 className="text-xl font-semibold flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-purple-700" /> What type of gift do you want to focus on?
            </h2>
            <div className="flex flex-wrap gap-2 mt-5">
              {focusOptions.map(opt => (
                <Button
                  key={opt}
                  variant={answers.focus === opt ? "default" : "outline"}
                  size="sm"
                  className="px-4"
                  onClick={() => setAnswers(prev => ({ ...prev, focus: opt }))}
                >
                  {opt}
                </Button>
              ))}
            </div>
          </div>
        );
      case "avoid":
        return (
          <div className="animate-fade-in p-6 pt-0">
            <h2 className="text-xl font-semibold flex items-center">
              <Gift className="w-5 h-5 mr-2 text-red-500" /> Any must-avoid items or special notes?
            </h2>
            <textarea
              className="mt-4 border rounded p-2 w-full"
              placeholder="Allergies, dislikes, etc. (leave blank if none)"
              rows={3}
              value={answers.avoid}
              onChange={e => setAnswers(prev => ({ ...prev, avoid: e.target.value }))}
            />
          </div>
        );
      case "complete":
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Sparkles className="w-12 h-12 mb-4 text-purple-600 animate-fade-in" />
            <h2 className="text-2xl font-bold mb-3 text-center">Ready for gift ideas?</h2>
            <Button onClick={handleWizardComplete} className="px-6 py-3 mt-4 text-lg">Show me gifts!</Button>
          </div>
        );
      default:
        return null;
    }
  }

  function stepCanContinue(): boolean {
    switch (currentStep) {
      case "recipient":
        return !!answers.recipient && (answers.recipient !== "Other" || !!answers.recipientOther);
      case "occasion":
        return !!answers.occasion && (answers.occasion !== "Custom" || !!answers.occasionCustom);
      case "age":
        return !!answers.age;
      case "interests":
        return (
          answers.interests.length > 0 ||
          (answers.interestCustom && answers.interestCustom.trim().length > 0)
        );
      case "budget":
        return !!answers.budget;
      case "focus":
        return !!answers.focus;
      // Avoid question is always optional
      case "avoid":
        return true;
      case "complete":
        return true;
      default:
        return false;
    }
  }

  function handleNext() {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    }
  }
  function handlePrev() {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  }

  function handleSkip() {
    // Fallback: Jump straight to gift suggestions with whatever is filled
    handleWizardComplete();
  }

  function handleWizardComplete() {
    // Compose search string using the onboarding answers
    const recipientVal =
      answers.recipient === "Other"
        ? answers.recipientOther
        : answers.recipient;
    const occasionVal =
      answers.occasion === "Custom"
        ? answers.occasionCustom
        : answers.occasion;

    let allInterests = answers.interests || [];
    if (answers.interestCustom && answers.interestCustom.length > 0) {
      allInterests = [
        ...allInterests,
        ...answers.interestCustom
          .split(",")
          .map(s => s.trim())
          .filter(Boolean)
      ];
    }
    // Build a single search string
    const searchTerms = [
      occasionVal,
      recipientVal,
      answers.age,
      ...allInterests,
      answers.budget,
      answers.focus
    ]
      .filter(Boolean)
      .join(" ");

    // Save specific notes to sessionStorage for future use if needed
    if (answers.avoid) {
      sessionStorage.setItem("giftor_onboarding_avoid", answers.avoid);
    }

    // Mark onboarding as complete so they don't see again
    localStorage.setItem("onboardingComplete", "true");
    localStorage.removeItem("newSignUp");

    // Route to marketplace with the search query
    navigate(`/marketplace?search=${encodeURIComponent(searchTerms)}`);
  }

  // Progress bar and stepper
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex flex-col onboarding-container">
      <div className="w-full max-w-xl mx-auto mt-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-muted-foreground">
              Step {Math.min(currentStepIdx + 1, steps.length - 1)} of {steps.length - 1}
            </p>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden onboarding-card min-h-[300px]">
          {renderStep()}
        </div>
        {/* Stepper Navigation */}
        {currentStep !== "complete" && (
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStepIdx === 0}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!stepCanContinue()}
            >
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingGiftorFlow;
