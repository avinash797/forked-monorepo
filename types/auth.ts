export interface Charm {
  id: string;
  timestamp: string;
}

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  email: string;
  location: string | null;
  created_at: string;
  phone_verified: boolean;
  email_verified: boolean;
  charms: Charm[];
  reputation_score: number;
  profile_photo_url: string | null;
  bio: string | null;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  display_name?: string;
  profile_photo_url?: string;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  displayName: string;
}
