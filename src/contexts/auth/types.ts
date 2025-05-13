
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
}
