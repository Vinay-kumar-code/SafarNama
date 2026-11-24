import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { AccountType, Profile } from '../types';
import { isAccountType, profileDetails, profileFromUser } from '../lib/authHelpers';
import { getAndroidAuthRedirect, isNative, nativeAction } from '../lib/device';

type AuthResult = { error: Error | null; needsEmailConfirmation?: boolean };

interface SignUpDetails {
  fullName: string;
  username: string;
  role: AccountType;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isAdminPortalOpen: boolean;
  openAdminPortal: () => void;
  closeAdminPortal: () => void;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, details: SignUpDetails) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<AuthResult>;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  isOnboardingOpen: boolean;
  openOnboarding: () => void;
  closeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function authUnavailable() {
  if (!navigator.onLine) return new Error('Connect to the internet to sign in.');
  if (!isSupabaseConfigured) return new Error('Sign-in is unavailable on this build.');
  return null;
}

function asError(error: unknown) {
  return error instanceof Error ? error : new Error('Something went wrong. Please try again.');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [row, setRow] = useState<{ id: string; value: Record<string, unknown> }>();
  const [busy, setBusy] = useState(false);
  const [initializing, setInitializing] = useState(isSupabaseConfigured);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isOnboardingOpen, setOnboardingOpen] = useState(false);
  const [isAdminPortalOpen, setAdminPortalOpen] = useState(false);
  const user = session?.user ?? null;
  const userId = user?.id;
  const profile = user ? profileFromUser(user, row?.id === user.id ? row.value : null) : null;
  const isAdmin = profile?.activeRole === 'admin';

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setInitializing(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void supabase.from('profiles').select('*').eq('id', userId).maybeSingle().then(({ data }) => {
      if (active && data) setRow({ id: userId, value: data });
    });
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (!isNative || !isSupabaseConfigured) return;
    async function completeSignIn(event: Event) {
      const { code, error } = (event as CustomEvent<{ code?: string; error?: string }>).detail;
      try {
        if (error || !code) throw new Error('Sign-in was not completed');
        const result = await supabase.auth.exchangeCodeForSession(code);
        if (result.error) throw result.error;
        setAuthModalOpen(false);
      } catch {
        window.dispatchEvent(new CustomEvent('safarnama:notice', { detail: 'Sign-in couldn’t be completed. Please try again.' }));
      }
    }
    window.addEventListener('safarnama:auth-callback', completeSignIn);
    return () => window.removeEventListener('safarnama:auth-callback', completeSignIn);
  }, []);

  async function runAuth(action: () => Promise<AuthResult>): Promise<AuthResult> {
    const unavailable = authUnavailable();
    if (unavailable) return { error: unavailable };
    setBusy(true);
    try { return await action(); }
    catch (error) { return { error: asError(error) }; }
    finally { setBusy(false); }
  }

  function signIn(email: string, password: string) {
    return runAuth(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };
      setSession(data.session);
      setAuthModalOpen(false);
      return { error: null };
    });
  }

  function signUp(email: string, password: string, details: SignUpDetails) {
    return runAuth(async () => {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: isNative ? getAndroidAuthRedirect() : window.location.origin,
          data: { full_name: details.fullName, username: details.username, account_type: details.role },
        },
      });
      if (error) return { error };
      if (!data.session) return { error: null, needsEmailConfirmation: true };
      setSession(data.session);
      setAuthModalOpen(false);
      setOnboardingOpen(true);
      return { error: null };
    });
  }

  function signInWithGoogle() {
    return runAuth(async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: isNative ? getAndroidAuthRedirect() : window.location.origin, skipBrowserRedirect: isNative },
      });
      if (error) return { error };
      if (isNative) {
        if (!data.url) return { error: new Error('Google sign-in is unavailable.') };
        await nativeAction({ action: 'openAuth', url: data.url });
      }
      return { error: null };
    });
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      window.dispatchEvent(new CustomEvent('safarnama:notice', { detail: 'Could not sign out. Please try again.' }));
      return;
    }
    setSession(null);
    setRow(undefined);
    setAdminPortalOpen(false);
    setOnboardingOpen(false);
  }

  async function updateProfile(updates: Partial<Profile>): Promise<AuthResult> {
    if (!profile || !user) return { error: new Error('Sign in to update your profile.') };
    const details = profileDetails({ ...profile, ...updates });
    const role = isAccountType(updates.activeRole) ? updates.activeRole : profile.activeRole;
    const { data, error } = await supabase.auth.updateUser({
      data: { safarnama_profile: details, ...(isAccountType(role) && { account_type: role }) },
    });
    if (error) return { error };
    if (data.user) setSession(previous => previous && previous.user.id === data.user.id ? { ...previous, user: data.user } : previous);
    return { error: null };
  }

  function openAuthModal(mode: 'signin' | 'signup' = 'signin') {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }

  return <AuthContext.Provider value={{
    user, profile, isAuthenticated: Boolean(user), isLoading: initializing || busy, isAdmin,
    signIn, signUp, signInWithGoogle, signOut, updateProfile,
    isAuthModalOpen, authModalMode, openAuthModal, closeAuthModal: () => setAuthModalOpen(false),
    isOnboardingOpen: isOnboardingOpen && Boolean(user), openOnboarding: () => user ? setOnboardingOpen(true) : openAuthModal(),
    closeOnboarding: () => setOnboardingOpen(false),
    isAdminPortalOpen: isAdminPortalOpen && isAdmin, openAdminPortal: () => { if (isAdmin) setAdminPortalOpen(true); },
    closeAdminPortal: () => setAdminPortalOpen(false),
  }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is required');
  return context;
}
