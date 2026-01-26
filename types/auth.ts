import { Database } from './database.types';

export interface Charm {
    id: string;
    timestamp: string;
}

export type UserProfile = Database['public']['Tables']['profiles']['Row'];

export interface User {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
}

export interface AuthState {
    user: User | null;
    profile: UserProfile | null;
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
