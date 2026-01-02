import { Database } from "./database";

export interface Charm {
  id: string;
  timestamp: string;
}

export type Profile = Database['public']['Tables']['users']['Row'];

export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
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
