// contexts/AuthContext.tsx
import { supabase } from "utils/supabase";
import { Session, User } from "@supabase/supabase-js";
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: {
    email: (email: string, password: string) => Promise<void>;
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
    const { data } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        // Only update if the state has actually changed
        if (currentSession?.user?.id !== user?.id) {
          console.log(
            "Auth state changed:",
            event,
            "User:",
            currentSession?.user?.email
          );
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          // If user is confirmed and signed in, ensure profile exists
          if (event === "SIGNED_IN" && currentSession?.user) {
            handleProfileCreation(currentSession.user);
          }
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("Initial session:", initialSession?.user?.email);
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
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (fetchError && !existingProfile) {
        // Create profile if it doesn't exist
        const { error: insertError } = await supabase
          .from("profiles")
          .insert([
            {
              id: user.id,
              email: user.email,
              created_at: new Date().toISOString(),
            },
          ])
          .single();

        if (insertError) {
          console.error("Error creating profile:", insertError);
        } else {
          console.log("Profile created for confirmed user:", user.email);
        }
      }
    } catch (error) {
      console.error("Error handling profile creation:", error);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    loading,
    signIn: {
      email: async (email: string, password: string) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          console.log("Sign in successful:", data.user?.email);
        } catch (error) {
          console.error("Sign in error:", error);
          throw error;
        }
      },
      google: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
        });
        if (error) throw error;
      },
      apple: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "apple",
        });
        if (error) throw error;
      },
      github: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "github",
        });
        if (error) throw error;
      },
    },
    signUp: async (email: string, password: string) => {
      try {
        console.log("Starting sign up process for:", email);

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        if (!data.user)
          throw new Error("Sign up successful but no user returned");

        console.log(
          "Sign up successful - confirmation email sent to:",
          data.user.email
        );
        alert(
          "Please check your email to confirm your account before signing in."
        );
      } catch (error) {
        console.error("Sign up process failed:", error);
        throw error;
      }
    },
    signOut: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        // Clear local state
        setSession(null);
        setUser(null);
        console.log("Sign out successful");
      } catch (error) {
        console.error("Sign out error:", error);
        throw error;
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
