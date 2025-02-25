// contexts/AuthContext.tsx
import { Session, User } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { mixpanel } from 'utils/mixpanel';
import { supabase } from 'utils/supabase';

interface Profile {
  id: string;
  email?: string;
  created_at: string;
  is_anonymous: boolean;
  display_name: string;
}

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
  isAnonymous: (checkUser?: User | null) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<Error | null>(null);

  // Single unified auth initialization
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('🔄 Auth state changed:', event, {
        userId: newSession?.user?.id,
        isAnonymous: newSession?.user?.app_metadata?.provider === 'anonymous',
      });

      // Always update state immediately to prevent UI hangs
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      // Handle profile creation in the background
      if (newSession?.user) {
        console.log('👤 User in new session:', {
          id: newSession.user.id,
          email: newSession.user.email,
          provider: newSession.user.app_metadata?.provider,
        });

        // Use a timeout to ensure UI updates first
        setTimeout(() => {
          console.log('⏱️ Starting background profile creation for user:', newSession.user.id);
          handleProfileCreation(newSession.user).catch((error) =>
            console.error('❌ Background profile creation error:', error)
          );
        }, 100);
      } else {
        console.log('ℹ️ Auth state changed with no user in session');
      }
    });

    // Initial session check
    const checkSession = async () => {
      try {
        console.log('🔍 Starting initial session check...');
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Error getting session:', error);
          setLoading(false);
          return;
        }

        console.log(
          '📋 Initial session check result:',
          initialSession ? 'Has session' : 'No session'
        );
        if (initialSession?.user) {
          console.log('👤 Found existing user session:', {
            id: initialSession.user.id,
            email: initialSession.user.email,
            provider: initialSession.user.app_metadata?.provider,
          });
          setSession(initialSession);
          setUser(initialSession.user);
          await handleProfileCreation(initialSession.user);
        } else {
          // Create anonymous user if no session exists
          try {
            console.log('🔑 No existing session found. Creating anonymous user...');
            const { data, error: signInError } = await supabase.auth.signInAnonymously();

            if (signInError) {
              console.error('❌ Error creating anonymous user:', signInError);
              setLoading(false);
              return;
            }

            if (data.user) {
              console.log('✅ Successfully created anonymous user:', {
                id: data.user.id,
                provider: data.user.app_metadata?.provider,
              });
              mixpanel.track('Anonymous User Created');
              await handleProfileCreation(data.user);
            } else {
              console.warn('⚠️ Anonymous sign-in succeeded but no user data returned');
            }
          } catch (signInError) {
            console.error('❌ Exception creating anonymous user:', signInError);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('❌ Exception in checkSession:', error);
        setLoading(false);
      }
    };

    checkSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Improved profile creation with better error handling and logging
  const handleProfileCreation = async (user: User) => {
    if (!user) {
      console.warn('⚠️ handleProfileCreation called with no user');
      return;
    }

    console.log('🔍 Checking if profile exists for user:', user.id);
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single<Profile>();

      if (existingProfile) {
        console.log('✅ Profile already exists for user:', {
          userId: user.id,
          isAnonymous: existingProfile.is_anonymous,
          displayName: existingProfile.display_name,
        });
        return;
      }

      if (fetchError) {
        console.log('ℹ️ No existing profile found, creating new profile');

        // Ensure we have provider info before creating profile
        const isAnonymous = user.app_metadata?.provider === 'anonymous';
        console.log('👤 User authentication provider:', user.app_metadata?.provider);

        // If the user is anonymous but app_metadata doesn't reflect it,
        // update the app_metadata
        if (existingProfile && (existingProfile as Profile).is_anonymous && !isAnonymous) {
          try {
            console.log('🔄 Updating app_metadata to mark user as anonymous');
            await supabase.auth.updateUser({
              data: { provider: 'anonymous' },
            });
            console.log('✅ Successfully updated app_metadata');
          } catch (error) {
            console.error('❌ Failed to update app_metadata:', error);
          }
        }

        const profileData = {
          id: user.id,
          email: user.email,
          created_at: new Date().toISOString(),
          is_anonymous: isAnonymous,
          display_name: user.email ? user.email.split('@')[0] : `user_${nanoid(6)}`,
        };

        console.log('📝 Creating new profile with data:', {
          userId: profileData.id,
          email: profileData.email,
          isAnonymous: profileData.is_anonymous,
          displayName: profileData.display_name,
        });

        const { error: insertError } = await supabase.from('profiles').insert([profileData]);

        if (insertError) {
          console.error('❌ Error inserting profile:', insertError);
        } else {
          console.log('✅ Successfully created new profile for user:', user.id);
        }
      }
    } catch (error) {
      console.error('❌ Exception in handleProfileCreation:', error);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    loading,
    error,
    signIn: {
      email: async (email: string, password: string) => {
        console.log('🔑 Attempting email sign in for:', email);
        const {
          data: { user },
          error,
        } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('❌ Email sign in failed:', error);
          throw error;
        }

        if (user) {
          console.log('✅ Email sign in successful for user:', user.id);
          mixpanel.identify(user.id);
          mixpanel.setUserProperties({
            auth_method: 'email',
            signed_up_at: user.created_at,
          });
          mixpanel.track('Sign In', { method: 'email' });
        } else {
          console.warn('⚠️ Sign in succeeded but no user data returned');
        }
      },
      google: async () => {
        console.log('🔑 Attempting Google sign in');
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
        });
        if (error) {
          console.error('❌ Google sign in failed:', error);
          throw error;
        }
        console.log('✅ Google sign in initiated successfully');
      },
      apple: async () => {
        console.log('🔑 Attempting Apple sign in');
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
        });
        if (error) {
          console.error('❌ Apple sign in failed:', error);
          throw error;
        }
        console.log('✅ Apple sign in initiated successfully');
      },
      anonymous: async () => {
        console.log('🔑 Attempting anonymous sign in');
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error('❌ Anonymous sign in failed:', error);
          throw error;
        }
        console.log('✅ Anonymous sign in successful:', data.user?.id);
        mixpanel.track('Anonymous Sign In');
      },
    },
    signUp: async (email: string, password: string) => {
      try {
        console.log('📝 Starting sign up process for:', email);

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          console.error('❌ Sign up failed:', error);
          throw error;
        }

        if (!data.user) {
          console.error('❌ Sign up successful but no user returned');
          throw new Error('Sign up successful but no user returned');
        }

        console.log('✅ Sign up successful for user:', {
          id: data.user.id,
          email: data.user.email,
          confirmationSent: data.user.confirmation_sent_at ? true : false,
        });

        // Track successful sign up with non-sensitive data
        mixpanel.track('Sign Up', {
          auth_method: 'email',
          timestamp: new Date().toISOString(),
          platform: Platform.OS,
          success: true,
        });

        console.log('📧 Confirmation email sent to:', data.user.email);
        alert('Please check your email to confirm your account before signing in.');
      } catch (error) {
        // Track failed sign up attempt (without sensitive info)
        console.error('❌ Sign up process failed:', error);
        mixpanel.track('Sign Up Failed', {
          auth_method: 'email',
          timestamp: new Date().toISOString(),
          platform: Platform.OS,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        throw error;
      }
    },
    signOut: async () => {
      try {
        console.log('🚪 Signing out user:', user?.id);
        mixpanel.track('Sign Out');
        mixpanel.reset();
        await supabase.auth.signOut();
        console.log('✅ Sign out successful');
      } catch (error) {
        console.error('❌ Error signing out:', error);
      }
    },
    convertAnonymous: async (email: string, password: string) => {
      try {
        console.log('🔄 Converting anonymous user to registered user:', {
          userId: user?.id,
          newEmail: email,
        });

        if (user?.app_metadata?.provider !== 'anonymous') {
          console.error('❌ Cannot convert non-anonymous user:', user?.app_metadata?.provider);
          throw new Error('User is not anonymous');
        }

        const { error } = await supabase.auth.updateUser({
          email,
          password,
        });

        if (error) {
          console.error('❌ Error converting anonymous user:', error);
          throw error;
        }

        console.log('✅ Successfully converted anonymous user to registered user');
        mixpanel.track('Anonymous User Converted', {
          success: true,
        });

        // Update profile
        console.log('📝 Updating profile for converted user');
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            email,
            is_anonymous: false,
            display_name: email.split('@')[0],
          })
          .eq('id', user.id);

        if (profileError) {
          console.error('⚠️ Error updating profile after conversion:', profileError);
        } else {
          console.log('✅ Successfully updated profile for converted user');
        }
      } catch (error) {
        console.error('❌ Anonymous user conversion failed:', error);
        mixpanel.track('Anonymous User Conversion Failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    isAnonymous: async (checkUser?: User | null) => {
      const userToCheck = checkUser || user;
      if (!userToCheck) {
        console.log('ℹ️ isAnonymous check: No user to check');
        return false;
      }

      console.log('🔍 Checking if user is anonymous:', userToCheck.id);

      // First check app_metadata
      if (userToCheck.app_metadata?.provider === 'anonymous') {
        console.log('✅ User is anonymous based on app_metadata');
        return true;
      }

      // If app_metadata doesn't have it, check the profiles table
      try {
        console.log('🔍 Checking profiles table for anonymous status');
        const { data, error } = await supabase
          .from('profiles')
          .select('is_anonymous')
          .eq('id', userToCheck.id)
          .single();

        if (error) {
          console.error('❌ Error checking profile for anonymous status:', error);
          return false;
        }

        console.log('ℹ️ Anonymous status from profile:', !!data?.is_anonymous);
        return !!data?.is_anonymous;
      } catch (error) {
        console.error('❌ Exception in isAnonymous check:', error);
        return false;
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
