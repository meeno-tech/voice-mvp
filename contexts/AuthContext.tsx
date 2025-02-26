// contexts/AuthContext.tsx
import { Session, User } from '@supabase/supabase-js';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { mixpanel } from 'utils/mixpanel';
import { supabase } from 'utils/supabase';

interface Profile {
  id: string;
  email?: string;
  created_at: string;
  is_anonymous: boolean;
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
  isAnonymous: (checkUser?: User | null) => boolean;
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
        isAnonymous: newSession?.user?.is_anonymous === true,
      });

      // Always update state immediately to prevent UI hangs
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      // Handle profile creation in the background
      if (newSession?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
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
        console.log(
          'ℹ️ Auth state changed with no user in session or not requiring profile update'
        );
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
        // Profile exists, only ensure is_anonymous is in sync with User object
        // NOTE: this is just because we have is_anonymous in profile, it isn't used and might be
        // removed in the future
        const isAnonymousUser = user.is_anonymous === true;

        if (existingProfile.is_anonymous !== isAnonymousUser) {
          console.log('🔄 Updating profile is_anonymous to match user.is_anonymous');
          await supabase
            .from('profiles')
            .update({ is_anonymous: isAnonymousUser })
            .eq('id', user.id);
        }

        console.log('✅ Profile already exists for user:', {
          userId: user.id,
          isAnonymous: isAnonymousUser,
        });
        return;
      }

      if (fetchError) {
        console.log('ℹ️ No existing profile found, creating new profile');

        const isAnonymous = user.is_anonymous === true;

        console.log('👤 User authentication status:', {
          isAnonymous,
          is_anonymous_prop: user.is_anonymous,
        });

        const profileData = {
          id: user.id,
          email: user.email,
          created_at: new Date().toISOString(),
          is_anonymous: isAnonymous,
        };

        console.log('📝 Creating new profile with data:', {
          userId: profileData.id,
          email: profileData.email,
          isAnonymous: profileData.is_anonymous,
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

  /**
   * Convert an anonymous user to a registered user.
   * @param email - The email address to use for the new account
   * @param password - The password to use for the new account
   * @returns A promise that resolves to true if the conversion was successful, false otherwise
   */
  const convertAnonymousToRegistered = async (email: string, password: string) => {
    try {
      console.log('🔄 Converting anonymous user to registered user:', {
        userId: user?.id,
        newEmail: email,
      });

      if (!(user?.is_anonymous === true)) {
        console.error('❌ Cannot convert non-anonymous user');
        throw new Error('User is not anonymous');
      }

      // Check if the user already has an email set (partial conversion)
      const hasPartialConversion = user.email !== null && user.email !== '';

      if (hasPartialConversion) {
        // For users who already have an email but haven't confirmed it
        alert(
          'You already have a pending email confirmation. Please check your email and click the confirmation link to complete your account setup.'
        );

        // Optionally, offer to resend the confirmation email
        const resend = confirm('Would you like us to resend the confirmation email?');
        if (resend && user.email) {
          await supabase.auth.resend({
            type: 'signup',
            email: user.email,
          });
          alert('Confirmation email has been resent. Please check your inbox.');
        }

        return true;
      }

      // Normal flow for first-time conversion
      const { error } = await supabase.auth.updateUser({
        email,
        password,
        data: {
          is_anonymous: false,
          provider: 'email',
        },
      });

      if (error) {
        console.error('❌ Error converting anonymous user:', error);
        throw error;
      }

      console.log('✅ Successfully initiated anonymous user conversion');
      mixpanel.track('Anonymous User Conversion Initiated', {
        success: true,
      });

      // Update profile (updateUser() only updates user authentication data, not profile)
      if (user) {
        console.log('📝 Updating profile for converted user');
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            email,
            is_anonymous: false,
          })
          .eq('id', user.id);

        if (profileError) {
          console.error('⚠️ Error updating profile after conversion:', profileError);
        } else {
          console.log('✅ Successfully updated profile for converted user');
        }
      }

      // Alert the user about the confirmation email
      alert(
        'Please check your email to confirm your account. You need to click the confirmation link to complete the sign-up process.'
      );

      return true;
    } catch (error) {
      console.error('❌ Anonymous user conversion failed:', error);
      mixpanel.track('Anonymous User Conversion Failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
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

        // Check if current user is anonymous before signing in
        const isCurrentUserAnonymous = user?.is_anonymous === true;

        try {
          // If user is anonymous, try to convert to the existing account
          if (isCurrentUserAnonymous) {
            console.log('🔄 Anonymous user signing in to existing account');

            try {
              // First try to update the anonymous user (this will fail if email exists)
              // Supabase documentation also uses control flow like this
              await convertAnonymousToRegistered(email, password);
              console.log('✅ Successfully converted anonymous user to registered user');
              return;
            } catch {
              // If error indicates email exists, proceed with normal sign-in
              console.log('ℹ️ Email exists, proceeding with normal sign-in');
            }
          }

          // Normal sign-in flow
          const {
            data: { user: signedInUser },
            error,
          } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            console.error('❌ Email sign in failed:', error);
            throw error;
          }

          if (signedInUser) {
            console.log('✅ Email sign in successful for user:', signedInUser.id);

            // TODO: Data migration from anonymous to existing account (when data is available)
            // if (isCurrentUserAnonymous) {
            //   console.log('ℹ️ User transitioned from anonymous to authenticated');

            //   // According to Supabase documentation, this is where we would migrate data
            //   // from the anonymous user to the existing account.
            // }

            mixpanel.identify(signedInUser.id);
            mixpanel.setUserProperties({
              auth_method: 'email',
              signed_up_at: signedInUser.created_at,
            });
            mixpanel.track('Sign In', {
              method: 'email',
              was_anonymous: isCurrentUserAnonymous,
            });
          } else {
            console.warn('⚠️ Sign in succeeded but no user data returned');
          }
        } catch (error) {
          console.error('❌ Sign in process failed:', error);
          throw error;
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

        // Check if current user is anonymous
        const isCurrentUserAnonymous = user?.is_anonymous === true;

        // If user is anonymous, convert instead of creating a new account
        if (isCurrentUserAnonymous) {
          console.log('🔄 Converting anonymous user to registered user');
          await convertAnonymousToRegistered(email, password);
          return;
        }

        // Otherwise proceed with regular sign up
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
    isAnonymous: (checkUser?: User | null): boolean => {
      const userToCheck = checkUser || user;
      return userToCheck?.is_anonymous === true;
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
