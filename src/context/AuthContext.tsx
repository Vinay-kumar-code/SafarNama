import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, UserRole } from '../types';
import { CURRENT_USER_TRAVELER, CURRENT_USER_GUIDE } from '../data/mockData';
import { getStoredData, setStoredData } from '../lib/utils';
import { mapDbProfileToProfile, mapProfileToDbUpdates } from '../lib/authHelpers';

export interface SignUpMetadata {
  fullName: string;
  username: string;
  role?: UserRole;
  homeCity?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOfflineDemo: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; user?: User | null }>;
  signUp: (email: string, password: string, metadata: SignUpMetadata) => Promise<{ error: Error | null; user?: User | null; needsEmailConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  loginAsDemoUser: (role: 'traveler' | 'local_guide') => void;
  // Modal controls
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  isOnboardingOpen: boolean;
  openOnboarding: () => void;
  closeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(() => {
    return getStoredData<Profile | null>('safarnama_auth_profile', null);
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOfflineDemo, setIsOfflineDemo] = useState<boolean>(!isSupabaseConfigured || !navigator.onLine);

  // Modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);
  const openOnboarding = () => setIsOnboardingOpen(true);
  const closeOnboarding = () => setIsOnboardingOpen(false);

  // Fetch or create profile from Supabase public.profiles table
  const fetchOrCreateProfile = useCallback(async (authUser: User): Promise<Profile> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (data && !error) {
        const mapped = mapDbProfileToProfile(data, authUser.id, authUser.email);
        setProfile(mapped);
        setStoredData('safarnama_auth_profile', mapped);
        return mapped;
      }

      // If profile does not exist yet (e.g. fresh user or OAuth sign in), auto-create row
      const meta = authUser.user_metadata || {};
      const fallbackName = meta.full_name || meta.name || (authUser.email ? authUser.email.split('@')[0] : 'Safar Explorer');
      const fallbackUsername = meta.username || (authUser.email ? authUser.email.split('@')[0] : `traveler_${authUser.id.slice(0, 6)}`);

      const initialDbRow = {
        id: authUser.id,
        username: fallbackUsername,
        full_name: fallbackName,
        avatar_url: meta.avatar_url || meta.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        bio: meta.bio || 'Exploring authentic India • Map-First Traveler',
        active_role: meta.role || 'traveler',
        home_city: meta.home_city || 'New Delhi, India',
        is_verified_guide: false,
        guide_circuits: [],
        credibility_score: 100,
        passport_stamps_count: 1,
        languages_spoken: ['Hindi', 'English'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: inserted } = await supabase
        .from('profiles')
        .upsert(initialDbRow)
        .select()
        .single();

      const createdProfile = mapDbProfileToProfile(inserted || initialDbRow, authUser.id, authUser.email);
      setProfile(createdProfile);
      setStoredData('safarnama_auth_profile', createdProfile);

      // Trigger onboarding for first time profile setup
      setIsOnboardingOpen(true);

      return createdProfile;
    } catch (err) {
      console.warn('Error fetching Supabase profile, using fallback:', err);
      const fallbackProfile = mapDbProfileToProfile(null, authUser.id, authUser.email);
      setProfile(fallbackProfile);
      return fallbackProfile;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // 1. Check if Supabase credentials are configured
      if (!isSupabaseConfigured) {
        setIsOfflineDemo(true);
        // Load demo user if previously logged in demo mode
        const storedDemo = getStoredData<Profile | null>('safarnama_demo_user', null);
        if (storedDemo && isMounted) {
          setProfile(storedDemo);
        }
        setIsLoading(false);
        return;
      }

      try {
        // 2. Live Supabase getSession
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (currentSession?.user && isMounted) {
          setSession(currentSession);
          setUser(currentSession.user);
          setIsOfflineDemo(false);
          await fetchOrCreateProfile(currentSession.user);
        } else if (isMounted) {
          // If no session in Supabase, check demo fallback
          const storedDemo = getStoredData<Profile | null>('safarnama_demo_user', null);
          if (storedDemo) {
            setProfile(storedDemo);
          }
        }
      } catch (err) {
        console.warn('Supabase auth getSession failed, falling back to offline demo:', err);
        if (isMounted) {
          setIsOfflineDemo(true);
          const storedProfile = getStoredData<Profile | null>('safarnama_auth_profile', null);
          if (storedProfile) setProfile(storedProfile);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    // 3. Setup Supabase onAuthStateChange listener if configured
    let subscription: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured) {
      try {
        const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (!isMounted) return;
          setSession(newSession);
          setUser(newSession?.user ?? null);

          if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
            if (newSession?.user) {
              setIsOfflineDemo(false);
              await fetchOrCreateProfile(newSession.user);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setSession(null);
            setProfile(null);
            localStorage.removeItem('safarnama_auth_profile');
            localStorage.removeItem('safarnama_demo_user');
          }
        });
        subscription = data.subscription;
      } catch (e) {
        console.warn('Failed to attach Supabase auth state listener:', e);
      }
    }

    // Network status listener
    const handleOnline = () => {
      setIsOfflineDemo(!isSupabaseConfigured);
    };
    const handleOffline = () => {
      setIsOfflineDemo(true);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchOrCreateProfile]);

  // Realtime synchronization with public.profiles
  useEffect(() => {
    if (!isSupabaseConfigured || !user?.id || isOfflineDemo) return;

    try {
      const channel = supabase
        .channel(`public:profiles:${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload) => {
            if (payload.new) {
              const updated = mapDbProfileToProfile(payload.new, user.id, user.email);
              setProfile(updated);
              setStoredData('safarnama_auth_profile', updated);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Could not subscribe to profiles realtime channel:', e);
    }
  }, [user?.id, user?.email, isOfflineDemo]);

  // Sign In function
  const signIn = async (email: string, password: string): Promise<{ error: Error | null; user?: User | null }> => {
    setIsLoading(true);

    if (!isSupabaseConfigured || isOfflineDemo) {
      // Offline / Demo sign in
      const demoProfile: Profile = {
        ...CURRENT_USER_TRAVELER,
        id: `demo-${Date.now()}`,
        username: email.split('@')[0],
        fullName: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      };
      setProfile(demoProfile);
      setStoredData('safarnama_demo_user', demoProfile);
      setStoredData('safarnama_auth_profile', demoProfile);
      setIsLoading(false);
      closeAuthModal();
      return { error: null, user: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchOrCreateProfile(data.user);
      }
      closeAuthModal();
      return { error: null, user: data.user };
    } catch (err: any) {
      console.error('Supabase signIn error:', err);
      return { error: err };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up function
  const signUp = async (
    email: string,
    password: string,
    metadata: SignUpMetadata
  ): Promise<{ error: Error | null; user?: User | null; needsEmailConfirmation?: boolean }> => {
    setIsLoading(true);

    if (!isSupabaseConfigured || isOfflineDemo) {
      // Offline / Demo sign up
      const demoProfile: Profile = {
        id: `demo-${Date.now()}`,
        username: metadata.username || email.split('@')[0],
        fullName: metadata.fullName || 'Safar Explorer',
        avatarUrl: metadata.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        bio: metadata.bio || 'Exploring authentic India with SafarNama',
        activeRole: metadata.role || 'traveler',
        homeCity: metadata.homeCity || 'New Delhi, India',
        isVerifiedGuide: metadata.role === 'local_guide',
        guideCircuits: metadata.role === 'local_guide' ? ['Golden Triangle', 'Himachal Circuits'] : [],
        credibilityScore: 100,
        passportStampsCount: 1,
        languagesSpoken: ['Hindi', 'English'],
        visitedStates: ['Delhi', 'Himachal Pradesh'],
        stats: {
          tripsCompleted: 1,
          spotsSaved: 3,
          contributions: 1,
          guideToursLed: metadata.role === 'local_guide' ? 2 : 0,
        },
      };
      setProfile(demoProfile);
      setStoredData('safarnama_demo_user', demoProfile);
      setStoredData('safarnama_auth_profile', demoProfile);
      setIsLoading(false);
      closeAuthModal();
      openOnboarding();
      return { error: null, user: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata.fullName,
            username: metadata.username,
            role: metadata.role || 'traveler',
            home_city: metadata.homeCity || 'New Delhi, India',
            bio: metadata.bio || '',
            avatar_url: metadata.avatarUrl,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        setUser(data.user);
        setSession(data.session);

        // Pre-create or upsert profile in public.profiles table
        const initialDbRow = {
          id: data.user.id,
          username: metadata.username || email.split('@')[0],
          full_name: metadata.fullName || 'Safar Explorer',
          avatar_url: metadata.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          bio: metadata.bio || 'Exploring authentic India • Map-First Traveler',
          active_role: metadata.role || 'traveler',
          home_city: metadata.homeCity || 'New Delhi, India',
          is_verified_guide: metadata.role === 'local_guide',
          guide_circuits: metadata.role === 'local_guide' ? ['Heritage Circuits'] : [],
          credibility_score: 100,
          passport_stamps_count: 1,
          languages_spoken: ['Hindi', 'English'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        try {
          await supabase.from('profiles').upsert(initialDbRow);
        } catch (dbErr) {
          console.warn('Upsert to public.profiles failed (RLS may require confirmed email):', dbErr);
        }

        const newProfile = mapDbProfileToProfile(initialDbRow, data.user.id, data.user.email);
        setProfile(newProfile);
        setStoredData('safarnama_auth_profile', newProfile);

        closeAuthModal();
        openOnboarding();
        return {
          error: null,
          user: data.user,
          needsEmailConfirmation: !data.session,
        };
      }

      closeAuthModal();
      return { error: null, user: null };
    } catch (err: any) {
      console.error('Supabase signUp error:', err);
      return { error: err };
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth sign in
  const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
    if (!isSupabaseConfigured || isOfflineDemo) {
      // Demo Google login
      const googleDemoProfile: Profile = {
        ...CURRENT_USER_TRAVELER,
        id: `demo-google-${Date.now()}`,
        username: 'aarav_google',
        fullName: 'Aarav Sharma (Google)',
      };
      setProfile(googleDemoProfile);
      setStoredData('safarnama_demo_user', googleDemoProfile);
      setStoredData('safarnama_auth_profile', googleDemoProfile);
      closeAuthModal();
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      console.error('Supabase Google OAuth error:', err);
      return { error: err };
    }
  };

  // Sign out function
  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && !isOfflineDemo) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Error during supabase signOut:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.removeItem('safarnama_auth_profile');
      localStorage.removeItem('safarnama_demo_user');
      setIsLoading(false);
    }
  };

  // Update profile function with auto-sync to public.profiles table
  const updateProfile = async (updates: Partial<Profile>): Promise<{ error: Error | null }> => {
    // 1. Optimistic local update
    setProfile(prev => {
      const base = prev || CURRENT_USER_TRAVELER;
      const updated: Profile = {
        ...base,
        ...updates,
        stats: {
          ...base.stats,
          ...(updates.stats || {}),
        },
      };
      setStoredData('safarnama_auth_profile', updated);
      if (isOfflineDemo || !user) {
        setStoredData('safarnama_demo_user', updated);
      }
      return updated;
    });

    // 2. Sync to Supabase if configured & authenticated
    if (isSupabaseConfigured && user && !isOfflineDemo) {
      try {
        const dbUpdates = mapProfileToDbUpdates(updates);
        const { error } = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', user.id);

        if (error) {
          console.warn('Supabase profile update warning:', error);
          // If row didn't exist, try upsert
          await supabase.from('profiles').upsert({
            id: user.id,
            ...dbUpdates,
          });
        }
      } catch (err: any) {
        console.error('Failed to sync profile update to Supabase:', err);
        return { error: err };
      }
    }

    return { error: null };
  };

  // One-click quick demo login for travelers & local guides
  const loginAsDemoUser = (role: 'traveler' | 'local_guide') => {
    const demoProfile = role === 'traveler' ? CURRENT_USER_TRAVELER : CURRENT_USER_GUIDE;
    setProfile(demoProfile);
    setStoredData('safarnama_demo_user', demoProfile);
    setStoredData('safarnama_auth_profile', demoProfile);
    setIsOfflineDemo(true);
    closeAuthModal();
  };

  const isAuthenticated = Boolean(user || profile);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAuthenticated,
        isLoading,
        isOfflineDemo,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateProfile,
        loginAsDemoUser,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        isOnboardingOpen,
        openOnboarding,
        closeOnboarding,
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
