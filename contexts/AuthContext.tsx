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
    anonymously: () => Promise<void>;
  };
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAnonymous: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isEmailChange, setIsEmailChange] = useState(false);

  useEffect(() => {
    // Auto sign-in anonymously when no user is present and loading is complete
    const handleAnonymousSignIn = async () => {
      if (!loading && !user) {
        try {
          console.log('No user detected, signing in anonymously...');
          await signInAnonymously();
        } catch (error) {
          console.error('Error during automatic anonymous sign-in:', error);
        }
      }
    };

    handleAnonymousSignIn();
  }, [loading, user]);

  useEffect(() => {
    // Enable cross-tab auth state sync
    const { data } = supabase.auth.onAuthStateChange((event, currentSession) => {
      // Only update if the state has actually changed
      if (currentSession?.user?.id !== user?.id) {
        console.log('Auth state changed:', event, 'User:', currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const isUserAnonymous = currentSession.user.is_anonymous === true;
          setIsAnonymous(isUserAnonymous);
          console.log('User anonymous status:', isUserAnonymous);
        } else {
          setIsAnonymous(false);
        }

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
        const isUserAnonymous = initialSession.user.is_anonymous === true;
        setIsAnonymous(isUserAnonymous);
        console.log('Initial anonymous status:', isUserAnonymous);
      }

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

  const signInAnonymously = async () => {
    try {
      console.log('Starting anonymous sign-in');
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) throw error;

      console.log('Anonymous sign-in successful:', data?.user?.id);

      try {
        await mixpanel.initialize();
        mixpanel.identify(data.user?.id || 'anonymous-user');
        mixpanel.track('Sign In', { method: 'anonymous' });
      } catch (mixpanelError) {
        console.error('Mixpanel error during anonymous sign-in:', mixpanelError);
      }

      // Don't return data
    } catch (error) {
      console.error('Anonymous sign-in failed:', error);
      throw error;
    }
  };

  const handleAnonymousUserAuth = async (email: string) => {
    console.log('Handling anonymous user authentication with email:', email);

    try {
      // Try to update the anonymous user with the email
      const { error } = await supabase.auth.updateUser({ email });

      // If successful, mark as email change
      if (!error) {
        setIsEmailChange(true);
        console.log('Anonymous user updated with email, verification email sent');
        return;
      }

      // If email exists, send a regular OTP
      /*
       * When using updateUser on an email that already exists,
       * Supabase prevents it because it would create
       * a duplicate user. The OTP approach is the correct
       * way to authenticate with an existing account, as it verifies
       * the user owns that email address without trying to modify
       * another user's account.
       *
       * TODO migrate data manually when xp/awards exists
       */
      if (
        error.message.includes('already been registered') ||
        error.message.includes('already exists')
      ) {
        console.log('Email already exists, sending regular OTP');
        await supabase.auth.signInWithOtp({ email });
        return;
      }

      // Any other error
      throw error;
    } catch (error) {
      console.error(
        'Authentication request failed:',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  };

  const value: AuthContextType = {
    session,
    user,
    loading,
    isAnonymous,
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
        try {
          console.log('Requesting OTP for:', email);

          if (!user) {
            console.error('No user found - user should be anonymous at this point');
            throw new Error('Authentication error: No active user session');
          }

          setIsEmailChange(false);

          if (user.is_anonymous === true) {
            await handleAnonymousUserAuth(email);
          } else {
            // Catches non_anonymous users...shouldn't happen
            console.log('Regular user authentication with email:', email);
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (error) throw error;
          }

          console.log('Email verification request sent successfully to:', email);
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
          console.log('Verifying OTP for email:', email);

          //updateUser requires email_change, existing user requires magiclink (OTP)
          const otpType = isEmailChange ? 'email_change' : 'magiclink';

          const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: otpType,
          });

          if (error) throw error;

          console.log('User successfully verified with email:', email);

          if (data.user) {
            try {
              await mixpanel.initialize();
              mixpanel.identify(data.user.id);
              mixpanel.setUserProperties({
                auth_method: 'email_otp',
                signed_up_at: data.user.created_at,
                was_anonymous: isEmailChange,
              });

              if (isEmailChange) {
                mixpanel.track('Anonymous User Converted', { method: 'email_otp' });
              } else {
                mixpanel.track('Sign In', { method: 'email_otp' });
              }
              setIsEmailChange(false);
            } catch (mixpanelError) {
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
      anonymously: signInAnonymously,
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
