
export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  profile_image: string | null;
  profile_type: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
    };
  };
};
