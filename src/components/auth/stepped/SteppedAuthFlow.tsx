import React, { useReducer, useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GoogleIcon } from "@/components/ui/icons/GoogleIcon";
import { Button } from "@/components/ui/button";

import NameStep from "./steps/NameStep";
import EmailStep from "./steps/EmailStep";
import PasswordStep from "./steps/PasswordStep";
import BirthdayStep from "./steps/BirthdayStep";
import InterestsStep from "./steps/InterestsStep";
import PhotoStep from "./steps/PhotoStep";

// ── Types ──────────────────────────────────────────────────
interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthday: string;
  interests: string[];
  photoUrl: string;
}

type Action =
  | { type: "SET_FIELD"; field: keyof FormState; value: any }
  | { type: "PREFILL"; data: Partial<FormState> };

function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "PREFILL":
      return { ...state, ...action.data };
    default:
      return state;
  }
}

const initialState: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  birthday: "",
  interests: [],
  photoUrl: "",
};

// Steps for email vs oauth
type StepId = "name" | "email" | "password" | "birthday" | "interests" | "photo";
const EMAIL_STEPS: StepId[] = ["name", "email", "password", "birthday", "interests", "photo"];
const OAUTH_STEPS: StepId[] = ["birthday", "interests", "photo"];

// ── Component ──────────────────────────────────────────────
interface SteppedAuthFlowProps {
  invitationData?: {
    connectionId: string;
    recipientEmail: string;
    recipientName: string;
    senderName: string;
  } | null;
}

const SteppedAuthFlow: React.FC<SteppedAuthFlowProps> = ({ invitationData }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [state, dispatch] = useReducer(reducer, initialState);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isOAuth, setIsOAuth] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEntryScreen, setShowEntryScreen] = useState(true);

  const steps = isOAuth ? OAUTH_STEPS : EMAIL_STEPS;
  const totalSteps = steps.length;

  // Detect OAuth resume: user already has session from OAuth redirect
  useEffect(() => {
    const oauthResume = searchParams.get("oauth_resume") === "true";
    if (user && oauthResume) {
      console.log("[SteppedAuthFlow] OAuth resume detected, pre-filling from user_metadata");
      setIsOAuth(true);
      setShowEntryScreen(false);

      const meta = user.user_metadata || {};
      dispatch({
        type: "PREFILL",
        data: {
          firstName: meta.first_name || meta.name?.split(" ")[0] || "",
          lastName: meta.last_name || meta.name?.split(" ").slice(1).join(" ") || "",
          email: user.email || "",
          photoUrl: meta.avatar_url || meta.picture || "",
        },
      });
    }
  }, [user, searchParams]);

  // Pre-fill from invitation data
  useEffect(() => {
    if (invitationData) {
      if (invitationData.recipientName) {
        const parts = invitationData.recipientName.split(" ");
        dispatch({
          type: "PREFILL",
          data: {
            firstName: parts[0] || "",
            lastName: parts.slice(1).join(" ") || "",
          },
        });
      }
      if (invitationData.recipientEmail) {
        dispatch({ type: "SET_FIELD", field: "email", value: invitationData.recipientEmail });
      }
    }
  }, [invitationData]);

  const goNext = useCallback(() => {
    setDirection(1);
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, totalSteps]);

  const goBack = useCallback(() => {
    setDirection(-1);
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    } else if (!isOAuth) {
      setShowEntryScreen(true);
    }
  }, [currentStep, isOAuth]);

  // ── Google OAuth handler ──────────────────────────────────
  const handleGoogleSignIn = async () => {
    try {
      const redirectUrl = `${window.location.origin}/auth/oauth-complete`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            signup_source: "social_auth",
            user_type: "shopper",
          },
        },
      });

      if (error) {
        if (error.message.includes("provider is not enabled")) {
          toast.error("Google sign-in not available", {
            description: "Please contact the administrator to enable Google authentication.",
          });
        } else {
          toast.error("Google sign-in failed", { description: error.message });
        }
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      toast.error("Failed to sign in with Google");
    }
  };

  // ── Final submission ──────────────────────────────────────
  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      if (isOAuth && user) {
        // OAuth: update existing profile
        const profileUpdate: any = {
          dob: state.birthday,
          birth_year: new Date(state.birthday).getFullYear(),
          interests: state.interests,
          gift_preferences: state.interests.map((i) => ({
            category: i,
            importance: "medium",
          })),
          onboarding_completed: true,
        };

        if (state.photoUrl) {
          profileUpdate.profile_image = state.photoUrl;
        }

        // Also update name if changed
        if (state.firstName || state.lastName) {
          profileUpdate.first_name = state.firstName;
          profileUpdate.last_name = state.lastName;
          profileUpdate.name = `${state.firstName} ${state.lastName}`.trim();
          profileUpdate.username = `${state.firstName.toLowerCase()}.${state.lastName.toLowerCase()}`.replace(/[^a-z0-9.]/g, "");
        }

        const { error } = await supabase
          .from("profiles")
          .update(profileUpdate)
          .eq("id", user.id);

        if (error) throw error;

        toast.success("Profile complete! Welcome to Elyphant 🎉");
        navigate("/", { replace: true });
      } else {
        // Email signup: create account
        const redirectUrl = `${window.location.origin}/profile-setup`;

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: state.email,
          password: state.password,
          options: {
            data: {
              name: `${state.firstName} ${state.lastName}`.trim(),
              first_name: state.firstName,
              last_name: state.lastName,
              signup_source: invitationData ? "invite" : "stepped_signup",
              user_type: "shopper",
            },
            emailRedirectTo: redirectUrl,
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Failed to create account");

        // Set user identification
        try {
          await supabase.rpc("set_user_identification", {
            target_user_id: authData.user.id,
            user_type_param: "shopper",
            signup_source_param: invitationData ? "invite" : "stepped_signup",
            metadata_param: {
              name: `${state.firstName} ${state.lastName}`.trim(),
              signup_timestamp: new Date().toISOString(),
              signup_flow: "stepped_auth",
            },
            attribution_param: {
              source: invitationData ? "invite" : "stepped_signup",
              campaign: invitationData ? "connection_invitation" : "main_signup",
              referrer: document.referrer || "direct",
            },
          });
        } catch (e) {
          console.error("Error setting user identification:", e);
        }

        // Create profile with all collected data
        const profileData: any = {
          id: authData.user.id,
          first_name: state.firstName,
          last_name: state.lastName,
          name: `${state.firstName} ${state.lastName}`.trim(),
          username: `${state.firstName.toLowerCase()}.${state.lastName.toLowerCase()}`.replace(/[^a-z0-9.]/g, ""),
          email: state.email,
          dob: state.birthday,
          birth_year: new Date(state.birthday).getFullYear(),
          interests: state.interests,
          gift_preferences: state.interests.map((i) => ({
            category: i,
            importance: "medium",
          })),
          onboarding_completed: true,
          user_type: "shopper",
          data_sharing_settings: {
            dob: "friends",
            shipping_address: "private",
            gift_preferences: "public",
            email: "private",
          },
        };

        if (state.photoUrl) {
          profileData.profile_image = state.photoUrl;
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(profileData as any);

        if (profileError) {
          console.error("Profile creation error:", profileError);
          // Don't throw — account was created, profile can be completed later
        }

        toast.success("Account created! Welcome to Elyphant 🎉");

        // Store signup context for intelligent routing
        if (invitationData) {
          localStorage.setItem("signupContext", "gift_recipient");
        } else {
          localStorage.setItem("signupContext", "gift_giver");
        }

        navigate("/", { replace: true });
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.message?.includes("User already registered")) {
        toast.error("An account with this email already exists. Try signing in instead.");
      } else {
        toast.error(error.message || "Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Entry screen (before stepping) ────────────────────────
  if (showEntryScreen && !isOAuth) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background pt-safe pb-safe">
        <div className="flex-1 flex flex-col justify-center px-6 md:px-0 md:max-w-md md:mx-auto md:w-full">
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                Join Elyphant
              </h1>
              <p className="text-sm text-muted-foreground mt-3">
                {invitationData
                  ? `${invitationData.senderName} invited you to connect!`
                  : "The smarter way to give and receive gifts"}
              </p>
            </div>

            {/* Google button */}
            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              className="w-full h-12 text-base font-medium rounded-lg border-border gap-3 touch-manipulation"
            >
              <GoogleIcon className="w-5 h-5" />
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground">
                  or sign up with email
                </span>
              </div>
            </div>

            {/* Start email flow */}
            <Button
              onClick={() => setShowEntryScreen(false)}
              className="w-full h-12 text-base font-medium rounded-lg touch-manipulation"
            >
              Sign up with email
            </Button>

            {/* Sign in link */}
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/auth?mode=signin")}
                className="text-primary font-medium touch-manipulation"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Step rendering ────────────────────────────────────────
  const stepId = steps[currentStep];

  const renderStep = () => {
    const commonProps = {
      stepIndex: currentStep,
      totalSteps,
    };

    switch (stepId) {
      case "name":
        return (
          <NameStep
            firstName={state.firstName}
            lastName={state.lastName}
            onChange={(field, value) =>
              dispatch({ type: "SET_FIELD", field, value })
            }
            onNext={goNext}
            onBack={goBack}
            locked={isOAuth}
            {...commonProps}
          />
        );
      case "email":
        return (
          <EmailStep
            email={state.email}
            onChange={(v) => dispatch({ type: "SET_FIELD", field: "email", value: v })}
            onNext={goNext}
            onBack={goBack}
            {...commonProps}
          />
        );
      case "password":
        return (
          <PasswordStep
            password={state.password}
            onChange={(v) => dispatch({ type: "SET_FIELD", field: "password", value: v })}
            onNext={goNext}
            onBack={goBack}
            {...commonProps}
          />
        );
      case "birthday":
        return (
          <BirthdayStep
            birthday={state.birthday}
            onChange={(v) => dispatch({ type: "SET_FIELD", field: "birthday", value: v })}
            onNext={goNext}
            onBack={goBack}
            {...commonProps}
          />
        );
      case "interests":
        return (
          <InterestsStep
            interests={state.interests}
            onChange={(v) => dispatch({ type: "SET_FIELD", field: "interests", value: v })}
            onNext={goNext}
            onBack={goBack}
            {...commonProps}
          />
        );
      case "photo":
        return (
          <PhotoStep
            photoUrl={state.photoUrl}
            onChange={(v) => dispatch({ type: "SET_FIELD", field: "photoUrl", value: v })}
            onNext={handleComplete}
            onBack={goBack}
            onSkip={handleComplete}
            isLoading={isSubmitting}
            {...commonProps}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepId}
        custom={direction}
        initial={{ x: direction > 0 ? 80 : -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: direction > 0 ? -80 : 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full"
      >
        {renderStep()}
      </motion.div>
    </AnimatePresence>
  );
};

export default SteppedAuthFlow;
