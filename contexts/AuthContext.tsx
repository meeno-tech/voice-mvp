// contexts/AuthContext.tsx
import { Session, User } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { mixpanel } from 'utils/mixpanel';
import { supabase } from 'utils/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
  signIn: {
    email: (email: string, password: string) => Promise<void>;
    google: () => Promise<void>;
    apple: () => Promise<void>;
    anonymous: () => Promise<void>;
  };
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  convertAnonymous: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Single unified auth initialization
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          await handleProfileCreation(initialSession.user);
        } else {
          // Create anonymous user if no session exists
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) throw error;

          if (data.user) {
            console.log('Created anonymous user:', data.user.id);
            mixpanel.track('Anonymous User Created');
            await handleProfileCreation(data.user);
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth state changed:', event, 'User:', currentSession?.user?.email);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await handleProfileCreation(currentSession.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Improved profile creation with better error handling
  const handleProfileCreation = async (user: User) => {
    if (!user) return;

    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError && !existingProfile) {
        // Ensure we have provider info before creating profile
        const isAnonymous = user.app_metadata?.provider === 'anonymous';

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              email: user.email,
              created_at: new Date().toISOString(),
              is_anonymous: isAnonymous,
              display_name: user.email ? user.email.split('@')[0] : `user_${nanoid(6)}`,
            },
          ])
          .single();

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error handling profile creation:', error);
      // Don't throw - we want to continue even if profile creation fails
    }
  };

  const value: AuthContextType = {
    session,
    user,
    loading,
    error,
    signIn: {
      email: async (email: string, password: string) => {
        const {
          data: { user },
          error,
        } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (user) {
          mixpanel.identify(user.id);
          mixpanel.setUserProperties({
            auth_method: 'email',
            signed_up_at: user.created_at,
          });
          mixpanel.track('Sign In', { method: 'email' });
        }
      },
      google: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
        });
        if (error) throw error;
      },
      apple: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
        });
        if (error) throw error;
      },
      anonymous: async () => {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        mixpanel.track('Anonymous Sign In');
      },
    },
    signUp: async (email: string, password: string) => {
      try {
        console.log('Starting sign up process for:', email);

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        if (!data.user) throw new Error('Sign up successful but no user returned');

        // Track successful sign up with non-sensitive data
        mixpanel.track('Sign Up', {
          auth_method: 'email',
          timestamp: new Date().toISOString(),
          platform: Platform.OS,
          success: true,
        });

        console.log('Sign up successful - confirmation email sent to:', data.user.email);
        alert('Please check your email to confirm your account before signing in.');
      } catch (error) {
        // Track failed sign up attempt (without sensitive info)
        mixpanel.track('Sign Up Failed', {
          auth_method: 'email',
          timestamp: new Date().toISOString(),
          platform: Platform.OS,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        console.error('Sign up process failed:', error);
        throw error;
      }
    },
    signOut: async () => {
      try {
        mixpanel.track('Sign Out');
        mixpanel.reset();
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      }
    },
    convertAnonymous: async (email: string, password: string) => {
      try {
        if (user?.app_metadata?.provider !== 'anonymous') {
          throw new Error('User is not anonymous');
        }

        const { error } = await supabase.auth.updateUser({
          email,
          password,
        });

        if (error) throw error;

        mixpanel.track('Anonymous User Converted', {
          success: true,
        });

        // Update profile
        await supabase
          .from('profiles')
          .update({
            email,
            is_anonymous: false,
            display_name: email.split('@')[0],
          })
          .eq('id', user.id);
      } catch (error) {
        mixpanel.track('Anonymous User Conversion Failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
