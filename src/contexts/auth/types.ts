
import { Session, User } from '@supabase/supabase-js';

export interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

export interface AuthContextProps extends AuthState {
  signOut: () => Promise<void>;
  deleteUser: () => Promise<void>;
  isDebugMode: boolean;
  signIn?: (email: string, password: string) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signUp?: (email: string, password: string) => Promise<{
    error: Error | null;
    data: { user: User | null; session: Session | null };
  }>;
}
