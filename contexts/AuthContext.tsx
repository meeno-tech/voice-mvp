// contexts/AuthContext.tsx
import { Session, User } from '@supabase/supabase-js';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { mixpanel } from 'utils/mixpanel';
import { supabase } from 'utils/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: {
    email: (email: string, password: string) => Promise<void>;
    otp: (email: string) => Promise<void>;
    verifyOtp: (email: string, token: string) => Promise<void>;
    google: () => Promise<void>;
    apple: () => Promise<void>;
    github: () => Promise<void>;
  };
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Enable cross-tab auth state sync
    const { data } = supabase.auth.onAuthStateChange((event, currentSession) => {
      // Only update if the state has actually changed
      if (currentSession?.user?.id !== user?.id) {
        console.log('Auth state changed:', event, 'User:', currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // If user is confirmed and signed in, ensure profile exists
        if (event === 'SIGNED_IN' && currentSession?.user) {
          handleProfileCreation(currentSession.user);
        }
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log('Initial session:', initialSession?.user?.email);
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        handleProfileCreation(initialSession.user);
      }

      setLoading(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // Helper function to handle profile creation
  const handleProfileCreation = async (user: User) => {
    try {
      // Check if profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError && !existingProfile) {
        // Create profile if it doesn't exist
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              email: user.email,
              created_at: new Date().toISOString(),
            },
          ])
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          console.log('Profile created for confirmed user:', user.email);
        }
      }
    } catch (error) {
      console.error('Error handling profile creation:', error);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    loading,
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
          try {
            // TODO refactor the initialize and identify behavior to be handled in the mixpanel service
            // Initialize mixpanel first if needed
            await mixpanel.initialize();

            // Then identify the user
            mixpanel.identify(user.id);
            mixpanel.setUserProperties({
              auth_method: 'email',
              signed_up_at: user.created_at,
            });
            mixpanel.track('Sign In', { method: 'email' });
          } catch (mixpanelError) {
            // Log but don't fail authentication if mixpanel has issues
            console.error('Mixpanel error:', mixpanelError);
          }
        }
      },
      otp: async (email: string) => {
        console.log('Using Supabase URL:', process.env.SUPABASE_URL);
        try {
          console.log('Requesting OTP for:', email);

          const response = await supabase.auth.signInWithOtp({
            email,
            options: {
              shouldCreateUser: true,
              emailRedirectTo: undefined,
            },
          });

          if (response.error) throw response.error;

          console.log('OTP sent successfully to:', email);

          // Track OTP request
          mixpanel.track('OTP Requested', {
            timestamp: new Date().toISOString(),
            platform: Platform.OS,
          });
        } catch (error) {
          console.error('Error sending OTP:', error);
          throw error;
        }
      },
      verifyOtp: async (email: string, token: string) => {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
          });

          if (error) throw error;

          if (data.user) {
            try {
              // Initialize mixpanel first if needed
              await mixpanel.initialize();

              // Then identify the user
              mixpanel.identify(data.user.id);
              mixpanel.setUserProperties({
                auth_method: 'email_otp',
                signed_up_at: data.user.created_at,
              });
              mixpanel.track('Sign In', { method: 'email_otp' });
            } catch (mixpanelError) {
              // Log but don't fail authentication if mixpanel has issues
              console.error('Mixpanel error:', mixpanelError);
            }
          }
        } catch (error) {
          console.error('Error verifying OTP:', error);
          throw error;
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
      github: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'github',
        });
        if (error) throw error;
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
        // Track the event before signing out
        try {
          await mixpanel.initialize();
          mixpanel.track('Sign Out');
          mixpanel.reset();
        } catch (mixpanelError) {
          console.error('Mixpanel error during sign out:', mixpanelError);
        }

        // Sign out from Supabase
        await supabase.auth.signOut();

        // Immediately update local state
        setSession(null);
        setUser(null);

        console.log('User signed out successfully');
      } catch (error) {
        console.error('Error signing out:', error);
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
