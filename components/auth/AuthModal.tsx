// components/auth/AuthModal.tsx
import { ThemedText } from 'components/ThemedText';
import { ThemedView } from 'components/ThemedView';
import { IconSymbol } from 'components/ui/IconSymbol';
import { Colors } from 'constants/Colors';
import { useAuth } from 'contexts/AuthContext';
import { useColorScheme } from 'hooks/useColorScheme';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AuthModal({ visible, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(true); // Default to sign up flow
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  // Reset form when modal is opened
  useEffect(() => {
    if (visible) {
      setEmail('');
      setPassword('');
      setError('');
      setIsSignUp(true);
    }
  }, [visible]);

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn.email(email, password);
      }

      onClose();
    } catch (err) {
      console.error('Auth error:', err);
      if (err instanceof Error) {
        // Handle specific Supabase errors more gracefully
        if (err.message.includes('User already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
          setIsSignUp(false);
        } else if (err.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <ThemedView style={styles.container}>
              <View style={styles.header}>
                <ThemedText type="subtitle">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </ThemedText>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <IconSymbol name="xmark" size={20} color={Colors[theme].text} />
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <TextInput
                  style={[styles.input, { color: Colors[theme].text }]}
                  placeholder="Email"
                  placeholderTextColor={Colors[theme].tabIconDefault}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />

                <TextInput
                  style={[styles.input, { color: Colors[theme].text }]}
                  placeholder="Password"
                  placeholderTextColor={Colors[theme].tabIconDefault}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                />

                {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: Colors[theme].tint },
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleAuth}
                  disabled={loading}>
                  <ThemedText style={styles.buttonText} lightColor="#FFFFFF" darkColor="#FFFFFF">
                    {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
                  </ThemedText>
                  {loading && <ActivityIndicator color="#FFFFFF" style={styles.spinner} />}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setIsSignUp(!isSignUp);
                    setError(''); // Clear any existing errors
                  }}
                  style={styles.switchButton}
                  disabled={loading}>
                  <ThemedText style={[styles.switchText, loading && styles.textDisabled]}>
                    {isSignUp
                      ? 'Already have an account? Sign in'
                      : "Don't have an account? Sign up"}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <ThemedText style={styles.dividerText}>
                  or continue with
                </ThemedText>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtons}>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialAuth("google")}
                >
                  <FontAwesome name="google" size={24} color="#DB4437" />
                </TouchableOpacity>

                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => handleSocialAuth("apple")}
                  >
                    <FontAwesome
                      name="apple"
                      size={24}
                      color={Colors[theme].text}
                    />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialAuth("github")}
                >
                  <FontAwesome
                    name="github"
                    size={24}
                    color={Colors[theme].text}
                  />
                </TouchableOpacity> 
              </View>*/}
            </ThemedView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    width: '100%',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  closeButton: {
    padding: 8,
  },
  form: {
    gap: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: Colors.light.error,
    fontSize: 14,
    textAlign: 'center',
  },
  switchButton: {
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  textDisabled: {
    opacity: 0.7,
  },
  spinner: {
    marginLeft: 8,
  },
});
