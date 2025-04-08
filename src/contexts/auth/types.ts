
import { User, Session } from "@supabase/supabase-js";

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isDebugMode: boolean;
  signOut: () => Promise<void>;
  getUserProfile: () => Promise<any>;
  resendVerificationEmail: () => Promise<void>;
  updateUserProfile: (updates: any) => Promise<void>;
  deleteUser: () => Promise<void>;
}
