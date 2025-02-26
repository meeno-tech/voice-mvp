// components/auth/AuthModal.tsx
import { ThemedText } from 'components/ThemedText';
import { ThemedView } from 'components/ThemedView';
import { IconSymbol } from 'components/ui/IconSymbol';
import { Colors } from 'constants/Colors';
import { useAuth } from 'contexts/AuthContext';
import { useColorScheme } from 'hooks/useColorScheme';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useEffect, useState } from 'react';
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
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const { signIn } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  // Reset form when modal is opened
  useEffect(() => {
    if (visible) {
      setEmail('');
      setOtpCode('');
      setError('');
      setOtpSent(false);
    }
  }, [visible]);

  const handleSendOtp = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await signIn.otp(email);
      setOtpSent(true);
    } catch (err) {
      console.error('Auth error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) {
      setError('Please enter the verification code');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await signIn.verifyOtp(email, otpCode);
      onClose();
    } catch (err) {
      console.error('Auth error:', err);
      if (err instanceof Error) {
        if (err.message.includes('Invalid otp')) {
          setError('Invalid verification code. Please try again.');
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
                  {otpSent ? 'Enter Verification Code' : 'Continue with Email'}
                </ThemedText>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <IconSymbol name="xmark" size={20} color={Colors[theme].text} />
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                {!otpSent ? (
                  <>
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

                    {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

                    <TouchableOpacity
                      style={[
                        styles.button,
                        { backgroundColor: Colors[theme].tint },
                        loading && styles.buttonDisabled,
                      ]}
                      onPress={handleSendOtp}
                      disabled={loading}>
                      <ThemedText
                        style={styles.buttonText}
                        lightColor="#FFFFFF"
                        darkColor="#FFFFFF">
                        {loading ? 'Sending...' : 'Continue with Email'}
                      </ThemedText>
                      {loading && <ActivityIndicator color="#FFFFFF" style={styles.spinner} />}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <ThemedText style={styles.otpMessage}>
                      We&lsquo;ve sent a verification code to {email}
                    </ThemedText>

                    <TextInput
                      style={[styles.input, { color: Colors[theme].text }]}
                      placeholder="Verification Code"
                      placeholderTextColor={Colors[theme].tabIconDefault}
                      value={otpCode}
                      onChangeText={setOtpCode}
                      keyboardType="number-pad"
                      editable={!loading}
                    />

                    {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

                    <TouchableOpacity
                      style={[
                        styles.button,
                        { backgroundColor: Colors[theme].tint },
                        loading && styles.buttonDisabled,
                      ]}
                      onPress={handleVerifyOtp}
                      disabled={loading}>
                      <ThemedText
                        style={styles.buttonText}
                        lightColor="#FFFFFF"
                        darkColor="#FFFFFF">
                        {loading ? 'Verifying...' : 'Verify Code'}
                      </ThemedText>
                      {loading && <ActivityIndicator color="#FFFFFF" style={styles.spinner} />}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setOtpSent(false)}
                      style={styles.switchButton}
                      disabled={loading}>
                      <ThemedText style={[styles.switchText, loading && styles.textDisabled]}>
                        Try a different email
                      </ThemedText>
                    </TouchableOpacity>
                  </>
                )}
              </View>
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
    opacity: 0.5,
  },
  spinner: {
    marginLeft: 8,
  },
  otpMessage: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
});
