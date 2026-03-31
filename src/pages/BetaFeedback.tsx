import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Star, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const FEATURE_AREAS = [
  { key: "product_search", label: "Product Search", description: "Finding and browsing products on the marketplace" },
  { key: "wishlists", label: "Wishlists", description: "Creating, managing, and sharing wishlists" },
  { key: "gift_scheduling", label: "Gift Scheduling", description: "Scheduling gifts for future delivery" },
  { key: "checkout", label: "Checkout", description: "The purchasing and payment experience" },
  { key: "auto_gifts", label: "Auto-Gifts", description: "Setting up recurring/automatic gifts" },
  { key: "connections", label: "Connections & Invites", description: "Connecting with friends and family on the platform" },
];

interface FeedbackEntry {
  feature_area: string;
  rating: number | null;
  feedback_text: string;
}

const BetaFeedback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [userName, setUserName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [feedback, setFeedback] = useState<FeedbackEntry[]>(
    FEATURE_AREAS.map((f) => ({ feature_area: f.key, rating: null, feedback_text: "" }))
  );
  const [otherComments, setOtherComments] = useState("");

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setErrorMsg("No feedback token provided.");
        setValidating(false);
        return;
      }
      try {
        const { data, error } = await supabase.rpc("validate_beta_feedback_token", {
          p_token: token,
        });
        if (error) throw error;
        const result = data as any;
        if (result?.valid) {
          setValid(true);
          const firstName = result.name?.split(" ")[0] || "";
          setUserName(firstName);
        } else {
          setErrorMsg(result?.error || "Invalid token.");
        }
      } catch {
        setErrorMsg("Failed to validate token.");
      }
      setValidating(false);
    };
    validate();
  }, [token]);

  const setRating = (featureKey: string, rating: number) => {
    setFeedback((prev) =>
      prev.map((f) => (f.feature_area === featureKey ? { ...f, rating } : f))
    );
  };

  const setText = (featureKey: string, text: string) => {
    setFeedback((prev) =>
      prev.map((f) => (f.feature_area === featureKey ? { ...f, feedback_text: text } : f))
    );
  };

  const handleSubmit = async () => {
    const entries = [
      ...feedback.filter((f) => f.rating !== null || f.feedback_text.trim()),
      ...(otherComments.trim()
        ? [{ feature_area: "other", rating: null, feedback_text: otherComments.trim() }]
        : []),
    ];

    if (entries.length === 0) {
      toast.error("Please provide at least one rating or comment.");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("submit_beta_feedback", {
        p_token: token!,
        p_feedback: entries as any,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Submission failed");
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit feedback.");
    }
    setSubmitting(false);
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-xl font-semibold text-center">Invalid or Expired Link</h2>
            <p className="text-muted-foreground text-center text-sm">{errorMsg}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <CheckCircle className="h-12 w-12 text-emerald-500" />
            <h2 className="text-xl font-semibold text-center">Thank you for your feedback!</h2>
            <p className="text-muted-foreground text-center text-sm">
              Your responses help us build a better platform. We read every submission.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="flex items-center gap-2 mb-4">
            <img
              src="/lovable-uploads/9b4f3dc7-ff8b-46c4-9eb3-56681e8c73b9.png"
              alt="Elyphant"
              className="h-8 w-8"
            />
            <span className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-sky-500 bg-clip-text text-transparent">
              Elyphant
            </span>
          </div>
          <h1 className="text-2xl font-light text-foreground tracking-tight">
            {userName ? `Thanks for testing, ${userName}.` : "Beta Feedback"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Rate each feature and share your thoughts. Your feedback directly shapes what we build.
          </p>
        </div>
      </div>

      {/* Feedback Form */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {FEATURE_AREAS.map((feature) => {
          const entry = feedback.find((f) => f.feature_area === feature.key)!;
          return (
            <Card key={feature.key}>
              <CardContent className="p-5 space-y-3">
                <div>
                  <h3 className="font-medium text-foreground">{feature.label}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
                {/* Star rating */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(feature.key, star)}
                      className="p-0.5 transition-colors"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          entry.rating && star <= entry.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                  {entry.rating && (
                    <span className="text-xs text-muted-foreground ml-2 self-center">
                      {entry.rating}/5
                    </span>
                  )}
                </div>
                <Textarea
                  placeholder={`What worked well? What could be better?`}
                  value={entry.feedback_text}
                  onChange={(e) => setText(feature.key, e.target.value)}
                  className="min-h-[60px] text-sm"
                />
              </CardContent>
            </Card>
          );
        })}

        {/* Other comments */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-medium text-foreground">Other Comments</h3>
            <p className="text-xs text-muted-foreground">
              Anything else you'd like to share — bugs, ideas, general thoughts.
            </p>
            <Textarea
              placeholder="Share any additional feedback..."
              value={otherComments}
              onChange={(e) => setOtherComments(e.target.value)}
              className="min-h-[80px] text-sm"
            />
          </CardContent>
        </Card>

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Feedback"
          )}
        </Button>
      </div>
    </div>
  );
};

export default BetaFeedback;
