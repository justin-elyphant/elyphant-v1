
import { User, Session } from "@supabase/supabase-js";
import { Profile } from "@/types/supabase";

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  getUserProfile: () => Promise<Profile | null>;
  resendVerificationEmail: () => Promise<void>;
  updateUserProfile: (updates: Partial<Profile>) => Promise<void>;
  deleteUser: () => Promise<void>;
}
