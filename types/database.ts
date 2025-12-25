import type { Profile, Charm } from './auth';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at' | 'reputation_score' | 'charms' | 'phone_verified' | 'email_verified'> & {
          reputation_score?: number;
          charms?: Charm[];
          phone_verified?: boolean;
          email_verified?: boolean;
        };
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'email'>>;
      };
    };
  };
}
