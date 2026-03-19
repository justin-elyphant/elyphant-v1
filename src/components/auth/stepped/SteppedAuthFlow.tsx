import React, { useReducer, useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
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
import AddressStep from "./steps/AddressStep";
import { ShippingAddress } from "@/types/shipping";

// ── Types ──────────────────────────────────────────────────
interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthday: string;
  interests: string[];
  address: ShippingAddress;
  photoUrl: string;
  photoFile: File | null;
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
  address: { country: "US" },
  photoUrl: "",
  photoFile: null,
};

type StepId = "name" | "email" | "password" | "birthday" | "interests" | "address" | "photo";
const EMAIL_STEPS: StepId[] = ["name", "email", "password", "birthday", "interests", "address", "photo"];
const OAUTH_STEPS: StepId[] = ["birthday", "interests", "address", "photo"];

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
  const { refetchProfile } = useProfile();

  const [state, dispatch] = useReducer(reducer, initialState);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isOAuth, setIsOAuth] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEntryScreen, setShowEntryScreen] = useState(true);

  const steps = isOAuth ? OAUTH_STEPS : EMAIL_STEPS;
  const totalSteps = steps.length;

  // Detect OAuth resume
  useEffect(() => {
    const oauthResume = searchParams.get("oauth_resume") === "true";
    if (user && oauthResume) {
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

  // Scroll modal to top on step change
  useEffect(() => {
    const el = document.querySelector('[data-auth-modal-scroll]');
    if (el) el.scrollTop = 0;
  }, [currentStep]);

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
      const redirectUrl = new URL("/auth/oauth-complete", window.location.origin);
      redirectUrl.searchParams.set("signup_source", "social_auth");
      redirectUrl.searchParams.set("user_type", "shopper");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl.toString(),
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

  // ── Upload photo helper ────────────────────────────────────
  const uploadPhoto = async (userId: string): Promise<string | null> => {
    if (!state.photoFile) return state.photoUrl || null;
    try {
      const ext = state.photoFile.name.split(".").pop() || "jpg";
      const filePath = `profile-images/${userId}/profile-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(filePath, state.photoFile, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      return urlData.publicUrl;
    } catch (err: any) {
      console.error("Photo upload failed:", err);
      toast.error("Photo upload failed — you can update it later in settings.");
      return null;
    }
  };

  // ── Final submission ──────────────────────────────────────
  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      if (isOAuth && user) {
        const finalPhotoUrl = await uploadPhoto(user.id);
        const username = state.firstName && state.lastName
          ? `${state.firstName.toLowerCase()}.${state.lastName.toLowerCase()}`.replace(/[^a-z0-9.]/g, "")
          : user.email?.split("@")[0] || `user${Date.now()}`;

        const dobFormatted = state.birthday ? state.birthday.slice(5) : null;
        const birthYear = state.birthday ? parseInt(state.birthday.slice(0, 4)) : null;

        const { error } = await supabase.rpc("complete_onboarding", {
          p_user_id: user.id,
          p_first_name: state.firstName || user.user_metadata?.first_name || "",
          p_last_name: state.lastName || user.user_metadata?.last_name || "",
          p_email: user.email || "",
          p_username: username,
          p_dob: dobFormatted,
          p_birth_year: birthYear && !isNaN(birthYear) ? birthYear : null,
          p_interests: state.interests as any,
          p_gift_preferences: state.interests.map((i) => ({
            category: i,
            importance: "medium",
          })) as any,
          p_data_sharing_settings: {
            dob: "friends",
            shipping_address: "private",
            gift_preferences: "public",
            email: "private",
          } as any,
          p_shipping_address: state.address as any,
          p_profile_image: finalPhotoUrl || null,
        });

        if (error) throw error;

        // Fire-and-forget: process email queue immediately so welcome email sends now
        supabase.functions.invoke("process-email-queue", { body: { force: true } }).catch(console.error);

        toast.success("Profile complete! Welcome to Elyphant 🎉");
        navigate("/", { replace: true });
      } else {
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

        try {
          await supabase.rpc("set_user_identification", {
            target_user_id: authData.user.id,
            user_type_param: "shopper",
            signup_source_param: invitationData ? "invite" : "header_cta",
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

        // Upload photo now that we have a user id
        const emailFinalPhotoUrl = await uploadPhoto(authData.user.id);

        // Use RPC to reliably save profile + queue welcome email (bypasses RLS timing)
        const emailDobFormatted = state.birthday ? state.birthday.slice(5) : null;
        const emailBirthYear = state.birthday ? parseInt(state.birthday.slice(0, 4)) : null;

        const { error: profileError } = await supabase.rpc("complete_onboarding", {
          p_user_id: authData.user.id,
          p_first_name: state.firstName,
          p_last_name: state.lastName,
          p_email: state.email,
          p_username: `${state.firstName.toLowerCase()}.${state.lastName.toLowerCase()}`.replace(/[^a-z0-9.]/g, ""),
          p_dob: emailDobFormatted,
          p_birth_year: emailBirthYear && !isNaN(emailBirthYear) ? emailBirthYear : null,
          p_interests: state.interests as any,
          p_gift_preferences: state.interests.map((i) => ({
            category: i,
            importance: "medium",
          })) as any,
          p_data_sharing_settings: {
            dob: "friends",
            shipping_address: "private",
            gift_preferences: "public",
            email: "private",
          } as any,
          p_shipping_address: state.address as any,
          p_profile_image: emailFinalPhotoUrl || null,
        });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          throw new Error(`Profile save failed: ${profileError.message}`);
        }

        // Verify data actually persisted before navigating
        const { data: verifyProfile } = await supabase
          .from("profiles")
          .select("onboarding_completed, dob, shipping_address")
          .eq("id", authData.user.id)
          .single();

        if (!verifyProfile?.onboarding_completed) {
          throw new Error("Profile data did not persist. Please try again.");
        }

        // Fire-and-forget: process email queue immediately so welcome email sends now
        supabase.functions.invoke("process-email-queue", { body: { force: true } }).catch(console.error);

        toast.success("Account created! Welcome to Elyphant 🎉");

        if (invitationData) {
          localStorage.setItem("signupContext", "gift_recipient");
        } else {
          localStorage.setItem("signupContext", "gift_giver");
        }

        navigate("/", { replace: true });
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      const msg = error.message || "";
      if (msg.includes("User already registered")) {
        toast.error("An account with this email already exists. Try signing in instead.");
      } else if (msg.toLowerCase().includes("weak") || msg.toLowerCase().includes("password")) {
        toast.error("Please choose a stronger password");
        // Navigate back to the password step
        const passwordIndex = steps.indexOf("password");
        if (passwordIndex >= 0) {
          setDirection(-1);
          setCurrentStep(passwordIndex);
        }
      } else {
        toast.error(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Entry screen (inside modal) ────────────────────────────
  if (showEntryScreen && !isOAuth) {
    return (
      <div className="px-6 py-10 md:p-10">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Join Elyphant
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {invitationData
                ? `${invitationData.senderName} invited you to connect!`
                : "The smarter way to give and receive gifts"}
            </p>
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
      case "address":
        return (
          <AddressStep
            address={state.address}
            onChange={(v) => dispatch({ type: "SET_FIELD", field: "address", value: v })}
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
            onPhotoFile={(f) => dispatch({ type: "SET_FIELD", field: "photoFile", value: f })}
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
        initial={{ x: direction > 0 ? 60 : -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: direction > 0 ? -60 : 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full"
      >
        {renderStep()}
      </motion.div>
    </AnimatePresence>
  );
};

export default SteppedAuthFlow;
