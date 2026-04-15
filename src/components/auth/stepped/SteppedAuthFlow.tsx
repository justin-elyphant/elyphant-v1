import React, { useReducer, useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ElyphantTextLogo from "@/components/ui/ElyphantTextLogo";

import NameStep from "./steps/NameStep";
import EmailStep from "./steps/EmailStep";
import PasswordStep from "./steps/PasswordStep";
import BirthdayStep from "./steps/BirthdayStep";
import InterestsStep from "./steps/InterestsStep";
import PhotoStep from "./steps/PhotoStep";
import AddressStep from "./steps/AddressStep";
import { ShippingAddress } from "@/types/shipping";
import type { User } from "@supabase/supabase-js";

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

const DRAFT_KEY = "elyphant_signup_draft";

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
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Phase 1: store the created user after the password step
  const [createdUser, setCreatedUser] = useState<User | null>(null);

  const steps = isOAuth ? OAUTH_STEPS : EMAIL_STEPS;
  const totalSteps = steps.length;

  // ── localStorage draft persistence ────────────────────────
  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        // Don't restore password or photoFile for security
        const { password, photoFile, ...safeFields } = draft;
        dispatch({ type: "PREFILL", data: safeFields });
        console.log("📋 Restored signup draft from localStorage");
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Save draft on each field change (debounced via state)
  const draftSaveRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (draftSaveRef.current) clearTimeout(draftSaveRef.current);
    draftSaveRef.current = setTimeout(() => {
      try {
        // Don't persist password or File objects
        const { password, photoFile, ...safeDraft } = state;
        localStorage.setItem(DRAFT_KEY, JSON.stringify(safeDraft));
      } catch {
        // quota exceeded etc
      }
    }, 500);
    return () => {
      if (draftSaveRef.current) clearTimeout(draftSaveRef.current);
    };
  }, [state]);

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

  // ── Phase 1: Create account after password step ───────────
  const handleSignUp = useCallback(async (): Promise<boolean> => {
    setIsSigningUp(true);
    try {
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

      if (authError) {
        const msg = authError.message || "";
        if (msg.includes("User already registered")) {
          toast.error("An account with this email already exists. Try signing in instead.");
        } else if (msg.toLowerCase().includes("weak") || msg.toLowerCase().includes("password")) {
          toast.error("Please choose a stronger password");
        } else if (msg.toLowerCase().includes("database")) {
          toast.error("Account creation failed. Please try again in a moment.", {
            description: "If this keeps happening, contact support.",
          });
        } else {
          toast.error(msg || "Failed to create account");
        }
        return false;
      }

      if (!authData.user) {
        toast.error("Failed to create account. Please try again.");
        return false;
      }

      console.log("✅ Phase 1: Account created successfully:", authData.user.id);
      setCreatedUser(authData.user);

      // Fire-and-forget: set user identification
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

      return true;
    } catch (err: any) {
      console.error("Signup error:", err);
      toast.error(err.message || "Something went wrong. Please try again.");
      return false;
    } finally {
      setIsSigningUp(false);
    }
  }, [state.email, state.password, state.firstName, state.lastName, invitationData]);

  const goNext = useCallback(async () => {
    const stepId = steps[currentStep];

    // Phase 1: after password step, create account before proceeding
    if (stepId === "password" && !isOAuth && !createdUser) {
      const success = await handleSignUp();
      if (!success) return; // stay on password step with error shown
    }

    setDirection(1);
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, totalSteps, steps, isOAuth, createdUser, handleSignUp]);

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

  // ── Phase 2: Final submission (complete_onboarding only) ──
  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      if (isOAuth && user) {
        // OAuth flow — user already exists
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
          p_shipping_address: state.address as any,
          p_profile_image: finalPhotoUrl || null,
        });

        if (error) throw error;

        supabase.functions.invoke("process-email-queue", { body: { force: true } }).catch(console.error);

        toast.success("Profile complete! Welcome to Elyphant 🎉");
        localStorage.removeItem(DRAFT_KEY);

        // Process invite referral before navigating away
        const inviteUserId = searchParams.get('invite_user');
        const { processInviteReferral } = await import("@/utils/processInviteReferral");
        await processInviteReferral(user.id, user.email || "", inviteUserId || undefined);

        await refetchProfile();
        navigate("/home", { replace: true });
      } else {
        // Email flow — Phase 2: account already created at password step
        const targetUser = createdUser;
        if (!targetUser) {
          toast.error("Account not found. Please restart signup.");
          return;
        }

        const emailFinalPhotoUrl = await uploadPhoto(targetUser.id);

        const emailDobFormatted = state.birthday ? state.birthday.slice(5) : null;
        const emailBirthYear = state.birthday ? parseInt(state.birthday.slice(0, 4)) : null;

        const { error: profileError } = await supabase.rpc("complete_onboarding", {
          p_user_id: targetUser.id,
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
          p_shipping_address: state.address as any,
          p_profile_image: emailFinalPhotoUrl || null,
        });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          toast.error("Failed to save profile. Please try again.", {
            description: "Your account was created — you can complete setup in Settings if needed.",
          });
          return;
        }

        // Verify data actually persisted
        const { data: verifyProfile } = await supabase
          .from("profiles")
          .select("onboarding_completed, dob, shipping_address")
          .eq("id", targetUser.id)
          .single();

        if (!verifyProfile?.onboarding_completed) {
          toast.error("Profile data did not save correctly. Please try again.", {
            description: "Your account exists — you can complete setup in Settings.",
          });
          return;
        }

        supabase.functions.invoke("process-email-queue", { body: { force: true } }).catch(console.error);

        toast.success("Account created! Welcome to Elyphant 🎉");

        if (invitationData) {
          localStorage.setItem("signupContext", "gift_recipient");
        } else {
          localStorage.setItem("signupContext", "gift_giver");
        }

        localStorage.removeItem(DRAFT_KEY);

        // Process invite referral before navigating away
        const emailInviteUserId = searchParams.get('invite_user');
        console.log("[SteppedAuthFlow] About to process invite referral. invite_user:", emailInviteUserId, "targetUser:", targetUser.id, "email:", state.email);
        try {
          const { processInviteReferral } = await import("@/utils/processInviteReferral");
          await processInviteReferral(targetUser.id, state.email || "", emailInviteUserId || undefined);
          console.log("[SteppedAuthFlow] processInviteReferral completed successfully");
        } catch (referralErr) {
          console.error("[SteppedAuthFlow] processInviteReferral failed:", referralErr);
        }

        await refetchProfile();
        navigate("/home", { replace: true });
      }
    } catch (error: any) {
      console.error("Profile completion error:", error);
      const msg = error.message || "";
      toast.error(msg || "Something went wrong. Please try again.", {
        description: createdUser
          ? "Your account was created — you can complete setup in Settings."
          : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Entry screen (inside modal) ────────────────────────────
  if (showEntryScreen && !isOAuth) {
    return (
      <div className="px-8 py-12 md:px-10 md:py-14">
        <div className="space-y-8">
          {/* Branding */}
          <div className="flex justify-center">
            <ElyphantTextLogo />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Join Elyphant
            </h1>
            <p className="text-sm text-muted-foreground">
              {invitationData
                ? `${invitationData.senderName} invited you to connect!`
                : "The smarter way to give and receive gifts"}
            </p>
          </div>

          {/* Start email flow */}
          <Button
            onClick={() => setShowEntryScreen(false)}
            className="w-full h-13 text-base font-normal rounded-xl touch-manipulation"
          >
            Sign up with email
          </Button>

          {/* Divider */}
          <div className="border-t border-border/40" />

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
            isLoading={isSigningUp}
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
