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
import { OtpVerificationForm } from './OtpVerificationForm';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AuthModal({ visible, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(true); // Default to sign up flow
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');

  const { signIn, signUp } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  // Reset form when modal is opened
  useEffect(() => {
    if (visible) {
      setEmail('');
      setError('');
      setIsSignUp(true);
      setMagicLinkSent(false);
      setSentToEmail('');
    }
  }, [visible]);

  const handleAuth = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (isSignUp) {
        await signUp(email);
      } else {
        await signIn.email(email);
      }

      // Show magic link sent confirmation
      setSentToEmail(email);
      setMagicLinkSent(true);
    } catch (err) {
      console.error('Auth error:', err);
      if (err instanceof Error) {
        // Handle specific Supabase errors more gracefully
        if (err.message.includes('User already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
          setIsSignUp(false);
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

  const renderMagicLinkSent = () => (
    <View style={styles.form}>
      <ThemedText style={styles.title}>Check Your Email</ThemedText>
      
      <ThemedText style={styles.description}>
        We've sent a magic link to:
      </ThemedText>
      
      <ThemedText style={styles.emailHighlight}>{sentToEmail}</ThemedText>
      
      <ThemedText style={styles.description}>
        Click the link in the email to {isSignUp ? 'complete your sign up' : 'sign in'}.
      </ThemedText>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: Colors[theme].tint }]}
        onPress={onClose}>
        <ThemedText style={styles.buttonText} lightColor="#FFFFFF" darkColor="#FFFFFF">
          Close
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}>
          <Pressable 
            style={[
              styles.modalContent, 
              { backgroundColor: Colors[theme].background }
            ]} 
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <IconSymbol name="xmark" size={20} color={Colors[theme].text} />
              </TouchableOpacity>
            </View>

            {magicLinkSent ? (
              renderMagicLinkSent()
            ) : (
              <View style={styles.form}>
                <ThemedText style={styles.title}>
                  {isSignUp ? 'Create an Account' : 'Welcome Back'}
                </ThemedText>

                <TextInput
                  style={[
                    styles.input, 
                    { 
                      color: Colors[theme].text,
                      backgroundColor: Colors[theme].surfaceElement,
                      borderColor: Colors[theme].border
                    }
                  ]}
                  placeholder="Email"
                  placeholderTextColor={Colors[theme].tabIconDefault}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
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
            )}
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
  container: {
    width: '100%',
    alignItems: 'center',
  },
  modalContent: {
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
    justifyContent: 'flex-end',
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 16,
  },
  emailHighlight: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 16,
  },
});
