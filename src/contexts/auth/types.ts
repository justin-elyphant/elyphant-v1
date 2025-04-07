
import { User, Session } from "@supabase/supabase-js";
import { Profile } from "@/types/supabase";

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isDebugMode?: boolean;  // Added for test/debug mode
  signOut: () => Promise<void>;
  getUserProfile: () => Promise<Profile | null>;
  resendVerificationEmail: (email?: string) => Promise<void>;
  updateUserProfile: (updates: Partial<Profile>) => Promise<void>;
  deleteUser: () => Promise<void>;
}
