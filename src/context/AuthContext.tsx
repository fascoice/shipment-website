import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { 
  supabase, 
  isSupabaseConfigured, 
  getCurrentProfile, 
  signUpCustomer, 
  signInCustomer, 
  signOutUser,
  resetPasswordForEmail
} from '../lib/supabase';
import { ProfileRow } from '../types';

interface AuthContextType {
  user: User | null;
  profile: ProfileRow | null;
  session: Session | null;
  role: 'customer' | 'admin';
  isAdmin: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  signUp: (params: { email: string; password: string; fullName: string; phone?: string }) => Promise<void>;
  signIn: (params: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isConfigured = isSupabaseConfigured();

  const refreshProfile = async () => {
    if (!isConfigured) return;
    try {
      const p = await getCurrentProfile();
      setProfile(p);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    // 1. Initial session load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        refreshProfile();
      }
      setIsLoading(false);
    });

    // 2. Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await refreshProfile();
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const signUp = async ({ email, password, fullName, phone }: { email: string; password: string; fullName: string; phone?: string }) => {
    await signUpCustomer({ email, password, fullName, phone });
    await refreshProfile();
  };

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    await signInCustomer({ email, password });
    await refreshProfile();
  };

  const signOut = async () => {
    await signOutUser();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    await resetPasswordForEmail(email);
  };

  const role = profile?.role || 'customer';
  const isAdmin = role === 'admin' || user?.email === 'overseasworldtransport@gmail.com';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        role,
        isAdmin,
        isLoading,
        isConfigured,
        signUp,
        signIn,
        signOut,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
